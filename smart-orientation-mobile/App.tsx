import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as SecureStore from "expo-secure-store";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "";

type Screen = "dashboard" | "chatbot" | "roadmaps" | "test" | "notifications";
type Question = { id: string; label: string; category: string; domains: string[]; skills: string[] };
type Profile = {
  name?: string;
  bacType?: string;
  bacAverage?: number;
  french?: number;
  english?: number;
  math?: number;
  physics?: number;
  svt?: number;
  FG?: number;
  gov?: string | null;
};

const BAC_TYPES = ["MATH", "SVT", "INFO", "ECO", "TECH", "LETTRES", "SPORT"];

const parseNumber = (value: string) => {
  const normalized = Number(value.replace(",", "."));
  return Number.isFinite(normalized) ? normalized : 0;
};

const ensureApi = () => {
  if (!API_BASE_URL) {
    Alert.alert("Configuration", "EXPO_PUBLIC_API_URL doit pointer vers le backend NestJS.");
    return false;
  }
  return true;
};

export default function App() {
  const [token, setToken] = useState("");
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [screen, setScreen] = useState<Screen>("dashboard");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileForm, setProfileForm] = useState({
    name: "",
    bacType: "MATH",
    bacAverage: "0",
    french: "0",
    english: "0",
    math: "0",
    physics: "0",
    svt: "0",
    gov: "",
  });
  const [latest, setLatest] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [chatMessage, setChatMessage] = useState("");
  const [chatReply, setChatReply] = useState("");
  const [roadmaps, setRoadmaps] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [busyAction, setBusyAction] = useState("");
  const [error, setError] = useState("");

  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  useEffect(() => {
    SecureStore.getItemAsync("token").then((saved) => {
      if (saved) {
        setToken(saved);
        bootstrap(saved);
      }
    });
  }, []);

  const requestJson = async (path: string, options: RequestInit = {}) => {
    if (!ensureApi()) return;
    const res = await fetch(`${API_BASE_URL}${path}`, options);
    const text = await res.text();
    const data = text ? JSON.parse(text) : null;
    if (!res.ok) {
      const message = Array.isArray(data?.message) ? data.message.join("\n") : data?.message;
      throw new Error(message ?? "Une erreur est survenue.");
    }
    return data;
  };

  const bootstrap = async (jwt = token) => {
    if (!ensureApi()) return;
    setLoading(true);
    setError("");
    try {
      const loadedProfile = await loadProfile(jwt);
      await Promise.all([
        loadLatest(jwt),
        loadQuestions(),
        loadRoadmaps(loadedProfile?.bacType),
        loadNotifications(jwt),
      ]);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Chargement impossible.";
      setError(message);
      if (message.toLowerCase().includes("unauthorized")) {
        await logout();
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const login = async () => {
    if (!ensureApi()) return;
    if (!email.trim() || password.length < 6) {
      Alert.alert("Authentification", "Email requis et mot de passe de 6 caracteres minimum.");
      return;
    }
    setBusyAction("auth");
    setError("");
    try {
    const path = authMode === "login" ? "login" : "register";
      const data = await requestJson(`/auth/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
    });
    if (authMode === "register") {
        Alert.alert("Compte cree", "Vous pouvez maintenant completer votre profil.");
      setAuthMode("login");
        const loginData = await requestJson("/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim(), password }),
        });
        await SecureStore.setItemAsync("token", loginData.access_token);
        setToken(loginData.access_token);
        await bootstrap(loginData.access_token);
      } else {
        await SecureStore.setItemAsync("token", data.access_token);
        setToken(data.access_token);
        await bootstrap(data.access_token);
      }
    } catch (err) {
      Alert.alert("Authentification", err instanceof Error ? err.message : "Echec");
    } finally {
      setBusyAction("");
    }
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync("token");
    setToken("");
    setProfile(null);
    setLatest(null);
    setNotifications([]);
    setRoadmaps([]);
  };

  const loadProfile = async (jwt = token) => {
    const data = await requestJson("/student/me", { headers: { Authorization: `Bearer ${jwt}` } });
    if (data) {
      setProfile(data);
      setProfileForm({
        name: data.name ?? "",
        bacType: data.bacType ?? "MATH",
        bacAverage: String(data.bacAverage ?? 0),
        french: String(data.french ?? 0),
        english: String(data.english ?? 0),
        math: String(data.math ?? 0),
        physics: String(data.physics ?? 0),
        svt: String(data.svt ?? 0),
        gov: data.gov ?? "",
      });
    }
    return data as Profile | null;
  };

  const loadLatest = async (jwt = token) => {
    const data = await requestJson("/orientation-test/me/latest", { headers: { Authorization: `Bearer ${jwt}` } });
    if (data?.id) setLatest(data);
    return data;
  };

  const loadQuestions = async () => {
    const data = await requestJson("/orientation-test/questions");
    setQuestions(Array.isArray(data) ? data : []);
  };

  const loadRoadmaps = async (bacType = profile?.bacType) => {
    const data = await requestJson(`/chatbot/roadmap-cards?bacType=${encodeURIComponent(bacType ?? "")}`);
    setRoadmaps(Array.isArray(data.cards) ? data.cards : []);
  };

  const loadNotifications = async (jwt = token) => {
    const data = await requestJson("/notifications/me", { headers: { Authorization: `Bearer ${jwt}` } });
    setNotifications(Array.isArray(data) ? data : []);
  };

  const refresh = async () => {
    setRefreshing(true);
    await bootstrap(token);
  };

  const saveProfile = async () => {
    setBusyAction("profile");
    try {
      const payload = {
        name: profileForm.name.trim() || email,
        bacType: profileForm.bacType,
        bacAverage: parseNumber(profileForm.bacAverage),
        french: parseNumber(profileForm.french),
        english: parseNumber(profileForm.english),
        math: parseNumber(profileForm.math),
        physics: parseNumber(profileForm.physics),
        svt: parseNumber(profileForm.svt),
        gov: profileForm.gov.trim() || null,
      };
      const data = await requestJson("/student/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify(payload),
      });
      setProfile(data);
      await loadRoadmaps(data?.bacType);
      Alert.alert("Profil", "Profil enregistre.");
    } catch (err) {
      Alert.alert("Profil", err instanceof Error ? err.message : "Mise a jour impossible.");
    } finally {
      setBusyAction("");
    }
  };

  const submitTest = async () => {
    const payload = {
      answers: questions.map((question: Question) => ({
        questionId: question.id,
        label: question.label,
        value: answers[question.id] ?? 0,
        domains: question.domains,
        skills: question.skills,
      })),
    };

    if (questions.length === 0) {
      Alert.alert("Test", "Questions non chargees.");
      return;
    }
    setBusyAction("test");
    try {
      const data = await requestJson("/orientation-test/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(payload),
    });
      setLatest(data.test);
      Alert.alert("Test", "Resultats enregistres.");
    } catch (err) {
      Alert.alert("Test", err instanceof Error ? err.message : "Enregistrement impossible.");
    } finally {
      setBusyAction("");
    }
  };

  const downloadReport = async () => {
    const reportId = latest?.report?.id;
    if (!reportId) return;
    setBusyAction("report");
    try {
    const target = `${FileSystem.documentDirectory}orientation-report-${reportId}.pdf`;
    const result = await FileSystem.downloadAsync(`${API_BASE_URL}/reports/${reportId}/pdf`, target, { headers });
    if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(result.uri);
    } catch {
      Alert.alert("Rapport PDF", "Telechargement impossible.");
    } finally {
      setBusyAction("");
    }
  };

  const askChat = async () => {
    if (!chatMessage.trim()) return;
    setBusyAction("chat");
    try {
      const data = await requestJson("/chatbot/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: chatMessage.trim(),
          studentData: { bacType: profile?.bacType, score: profile?.FG, name: profile?.name },
        }),
    });
    setChatReply(data.reply ?? "");
    } catch (err) {
      Alert.alert("Chatbot", err instanceof Error ? err.message : "Reponse indisponible.");
    } finally {
      setBusyAction("");
    }
  };

  const markNotificationRead = async (id: number) => {
    try {
      const updated = await requestJson(`/notifications/${id}/read`, { method: "PATCH", headers });
      setNotifications((items) => items.map((item) => (item.id === id ? updated : item)));
    } catch {
      Alert.alert("Notifications", "Impossible de marquer cette notification.");
    }
  };

  if (!token) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.card}>
          <Text style={styles.title}>Smart Orientation</Text>
          <Text style={styles.muted}>{authMode === "login" ? "Connexion" : "Creation de compte"}</Text>
          <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" />
          <TextInput style={styles.input} placeholder="Mot de passe" value={password} onChangeText={setPassword} secureTextEntry />
          <Pressable style={[styles.button, busyAction === "auth" && styles.disabled]} onPress={login} disabled={busyAction === "auth"}>
            <Text style={styles.buttonText}>{busyAction === "auth" ? "Patientez..." : authMode === "login" ? "Se connecter" : "Creer compte"}</Text>
          </Pressable>
          <Pressable onPress={() => setAuthMode(authMode === "login" ? "register" : "login")}>
            <Text style={styles.link}>{authMode === "login" ? "Creer un compte" : "J ai deja un compte"}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}>
        <View style={styles.header}>
          <Text style={styles.title}>Smart Orientation</Text>
          <Pressable onPress={logout}><Text style={styles.link}>Sortir</Text></Pressable>
        </View>
        {loading && <View style={styles.inline}><ActivityIndicator /><Text style={styles.muted}>Synchronisation...</Text></View>}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <View style={styles.tabs}>
          {(["dashboard", "test", "chatbot", "roadmaps", "notifications"] as Screen[]).map((item) => (
            <Pressable key={item} style={[styles.tab, screen === item && styles.activeTab]} onPress={() => setScreen(item)}>
              <Text style={screen === item ? styles.activeTabText : styles.tabText}>{item}</Text>
            </Pressable>
          ))}
        </View>
        {screen === "dashboard" && (
          <Dashboard
            profile={profile}
            form={profileForm}
            setForm={setProfileForm}
            latest={latest}
            busy={busyAction}
            onSave={saveProfile}
            onReport={downloadReport}
          />
        )}
        {screen === "test" && <Test questions={questions} answers={answers} setAnswers={setAnswers} busy={busyAction === "test"} onSubmit={submitTest} />}
        {screen === "chatbot" && <Chatbot chatMessage={chatMessage} setChatMessage={setChatMessage} chatReply={chatReply} busy={busyAction === "chat"} onAsk={askChat} />}
        {screen === "roadmaps" && <Roadmaps roadmaps={roadmaps} />}
        {screen === "notifications" && <Notifications notifications={notifications} onRead={markNotificationRead} />}
      </ScrollView>
    </SafeAreaView>
  );
}

function Dashboard({ profile, form, setForm, latest, busy, onSave, onReport }: any) {
  return (
    <View style={styles.card}>
      <Text style={styles.heading}>{profile?.name ?? "Etudiant"}</Text>
      <Text>Bac: {profile?.bacType ?? "-"}</Text>
      <Text>Moyenne: {profile?.bacAverage ?? "-"}</Text>
      <Text>FG: {profile?.FG ?? "-"}</Text>
      {latest?.dominantDomains?.map((item: any) => <Text key={item.domain}>Domaine: {item.domain} ({item.score})</Text>)}
      {latest?.report?.id && (
        <Pressable style={[styles.secondaryButton, busy === "report" && styles.disabled]} onPress={onReport} disabled={busy === "report"}>
          <Text>{busy === "report" ? "Preparation PDF..." : "Telecharger rapport PDF"}</Text>
        </Pressable>
      )}
      <Text style={styles.heading}>Profil demo</Text>
      <TextInput style={styles.input} placeholder="Nom" value={form.name} onChangeText={(value) => setForm((current: any) => ({ ...current, name: value }))} />
      <View style={styles.actions}>
        {BAC_TYPES.map((type) => (
          <Pressable key={type} style={[styles.choice, form.bacType === type && styles.choiceActive]} onPress={() => setForm((current: any) => ({ ...current, bacType: type }))}>
            <Text>{type}</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.grid}>
        {[
          ["bacAverage", "Moyenne"],
          ["french", "Francais"],
          ["english", "Anglais"],
          ["math", "Math"],
          ["physics", "Physique"],
          ["svt", "SVT"],
        ].map(([key, label]) => (
          <TextInput
            key={key}
            style={styles.input}
            placeholder={label}
            keyboardType="decimal-pad"
            value={form[key]}
            onChangeText={(value) => setForm((current: any) => ({ ...current, [key]: value }))}
          />
        ))}
      </View>
      <TextInput style={styles.input} placeholder="Gouvernorat" value={form.gov} onChangeText={(value) => setForm((current: any) => ({ ...current, gov: value }))} />
      <Pressable style={[styles.button, busy === "profile" && styles.disabled]} onPress={onSave} disabled={busy === "profile"}>
        <Text style={styles.buttonText}>{busy === "profile" ? "Enregistrement..." : "Enregistrer le profil"}</Text>
      </Pressable>
    </View>
  );
}

function Test({ questions, answers, setAnswers, busy, onSubmit }: any) {
  return (
    <View style={styles.card}>
      <Text style={styles.heading}>Test d orientation</Text>
      {questions.length === 0 && <Text style={styles.muted}>Chargement des questions...</Text>}
      {questions.map((question: Question) => (
        <View key={question.id} style={styles.row}>
          <Text style={styles.question}>{question.label}</Text>
          <View style={styles.actions}>
            {[1, 3, 5].map((value) => (
              <Pressable key={value} style={[styles.choice, answers[question.id] === value && styles.choiceActive]} onPress={() => setAnswers((current: any) => ({ ...current, [question.id]: value }))}>
                <Text>{value}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ))}
      <Pressable style={[styles.button, busy && styles.disabled]} onPress={onSubmit} disabled={busy}><Text style={styles.buttonText}>{busy ? "Enregistrement..." : "Enregistrer le test"}</Text></Pressable>
    </View>
  );
}

function Chatbot({ chatMessage, setChatMessage, chatReply, busy, onAsk }: any) {
  return (
    <View style={styles.card}>
      <Text style={styles.heading}>Chatbot IA</Text>
      <TextInput style={styles.input} placeholder="Pose une question" value={chatMessage} onChangeText={setChatMessage} />
      <Pressable style={[styles.button, busy && styles.disabled]} onPress={onAsk} disabled={busy}><Text style={styles.buttonText}>{busy ? "Envoi..." : "Envoyer"}</Text></Pressable>
      {chatReply ? <Text style={styles.reply}>{chatReply}</Text> : null}
    </View>
  );
}

function Roadmaps({ roadmaps }: any) {
  return (
    <View style={styles.card}>
      <Text style={styles.heading}>Roadmaps</Text>
      {roadmaps.length === 0 && <Text style={styles.muted}>Aucune roadmap chargee.</Text>}
      {roadmaps.map((item: any) => (
        <View key={item.domain} style={styles.row}>
          <Text style={styles.question}>{item.field ?? item.domain}</Text>
          <Text style={styles.muted}>{item.description ?? item.demand}</Text>
        </View>
      ))}
    </View>
  );
}

function Notifications({ notifications, onRead }: any) {
  return (
    <View style={styles.card}>
      <Text style={styles.heading}>Notifications</Text>
      {notifications.length === 0 && <Text style={styles.muted}>Aucune notification.</Text>}
      {notifications.map((item: any) => (
        <Pressable key={item.id} style={styles.row} onPress={() => onRead(item.id)}>
          <Text style={styles.question}>{item.readAt ? item.title : `• ${item.title}`}</Text>
          <Text style={styles.muted}>{item.message}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f8fafc" },
  content: { padding: 16, gap: 16 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  tabs: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tab: { borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 },
  activeTab: { backgroundColor: "#2563eb", borderColor: "#2563eb" },
  tabText: { color: "#334155" },
  activeTabText: { color: "#fff", fontWeight: "700" },
  card: { backgroundColor: "#fff", borderRadius: 8, padding: 16, gap: 12, borderWidth: 1, borderColor: "#e2e8f0" },
  title: { fontSize: 28, fontWeight: "700", color: "#0f172a" },
  heading: { fontSize: 18, fontWeight: "700" },
  muted: { color: "#64748b" },
  link: { color: "#2563eb", fontWeight: "700" },
  input: { borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 8, padding: 12 },
  button: { backgroundColor: "#2563eb", borderRadius: 8, padding: 12, alignItems: "center" },
  disabled: { opacity: 0.6 },
  secondaryButton: { backgroundColor: "#e2e8f0", borderRadius: 8, padding: 12, alignItems: "center" },
  buttonText: { color: "#fff", fontWeight: "700" },
  row: { gap: 8, borderTopWidth: 1, borderTopColor: "#f1f5f9", paddingTop: 10 },
  question: { color: "#334155", fontWeight: "600" },
  actions: { flexDirection: "row", gap: 8 },
  grid: { gap: 8 },
  inline: { flexDirection: "row", gap: 8, alignItems: "center" },
  error: { color: "#b91c1c", fontWeight: "600" },
  choice: { borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  choiceActive: { backgroundColor: "#dbeafe", borderColor: "#2563eb" },
  reply: { color: "#334155", lineHeight: 20 },
});
