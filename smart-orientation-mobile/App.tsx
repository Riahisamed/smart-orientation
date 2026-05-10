import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  Alert,
  Animated,
  Easing,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
  Platform,
  StatusBar,
  Dimensions,
  ActivityIndicator,
  Modal,
  TouchableOpacity,
  FlatList,
} from "react-native";
import * as FileSystem from "expo-file-system";
import * as SecureStore from "expo-secure-store";
import * as Sharing from "expo-sharing";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const IS_SMALL = SCREEN_WIDTH < 370;

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "";

type Screen = "dashboard" | "chatbot" | "roadmaps" | "test" | "notifications";
type Question = { id: string; label: string; category: string; domains: string[]; skills: string[] };
type ChatMessage = { id: string; role: "user" | "assistant"; content: string };
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
type Theme = ReturnType<typeof makeTheme>;

const BAC_TYPES = ["MATH", "SVT", "INFO", "ECO", "TECH", "LETTRES", "SPORT"];
const SCREENS: { id: Screen; label: string; icon: keyof typeof Ionicons.glyphMap; iconActive: keyof typeof Ionicons.glyphMap }[] = [
  { id: "dashboard", label: "Accueil", icon: "grid-outline", iconActive: "grid" },
  { id: "test", label: "Test", icon: "options-outline", iconActive: "options" },
  { id: "chatbot", label: "Chat", icon: "chatbubble-ellipses-outline", iconActive: "chatbubble-ellipses" },
  { id: "roadmaps", label: "Roadmap", icon: "map-outline", iconActive: "map" },
  { id: "notifications", label: "Alertes", icon: "notifications-outline", iconActive: "notifications" },
];
const ACCENTS = ["#2563eb", "#10b981", "#f59e0b", "#8b5cf6", "#06b6d4", "#ef4444", "#ec4899", "#14b8a6"];

const parseNumber = (value: string) => {
  const normalized = Number(value.replace(",", "."));
  return Number.isFinite(normalized) ? normalized : 0;
};

const formatDate = (dateStr?: string) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
};

const ensureApi = () => {
  if (!API_BASE_URL) {
    Alert.alert("Configuration", "EXPO_PUBLIC_API_URL doit pointer vers le backend NestJS.");
    return false;
  }
  return true;
};

const makeTheme = (dark: boolean) => ({
  dark,
  bg: dark ? "#020617" : "#f6f8fc",
  surface: dark ? "#0f172a" : "#ffffff",
  surfaceSoft: dark ? "#111c31" : "#eef4ff",
  surfaceAlt: dark ? "#1a2440" : "#f1f5f9",
  text: dark ? "#f8fafc" : "#0f172a",
  muted: dark ? "#94a3b8" : "#64748b",
  border: dark ? "#1e293b" : "#e2e8f0",
  primary: "#2563eb",
  primarySoft: dark ? "#172554" : "#dbeafe",
  primaryDark: "#1d4ed8",
  secondary: "#8b5cf6",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
});

export default function App() {
  const colorScheme = useColorScheme();
  const theme = useMemo(() => makeTheme(colorScheme === "dark"), [colorScheme]);
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
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: "welcome", role: "assistant", content: "Bonjour 👋 Je suis ton assistant d'orientation. Pose-moi des questions sur tes choix, tes scores ou tes roadmaps !" },
  ]);
  const [roadmaps, setRoadmaps] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [busyAction, setBusyAction] = useState("");
  const [error, setError] = useState("");
  const [showRoadmapDetail, setShowRoadmapDetail] = useState<any>(null);
  const [loginLoading, setLoginLoading] = useState(false);
  const fade = useRef(new Animated.Value(1)).current;
  const slideUp = useRef(new Animated.Value(0)).current;

  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  useEffect(() => {
    SecureStore.getItemAsync("token").then((saved) => {
      if (saved) {
        setToken(saved);
        bootstrap(saved);
      }
    });
  }, []);

  useEffect(() => {
    fade.setValue(0);
    slideUp.setValue(10);
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 250,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideUp, {
        toValue: 0,
        duration: 250,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [screen]);

  useEffect(() => {
    if (showRoadmapDetail) {
      Animated.spring(slideUp, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 9,
      }).start();
    }
  }, [showRoadmapDetail]);

  const requestJson = async (path: string, options: RequestInit = {}) => {
    if (!ensureApi()) return;
    try {
      const res = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        ...(options.body && typeof options.body === "string" ? { headers: { ...options.headers, "Content-Type": "application/json" } } : {}),
      });
      const text = await res.text();
      const data = text ? JSON.parse(text) : null;
      if (!res.ok) {
        const message = Array.isArray(data?.message) ? data.message.join("\n") : data?.message;
        throw new Error(message ?? "Une erreur est survenue.");
      }
      return data;
    } catch (err) {
      if (err instanceof TypeError && err.message === "Network request failed") {
        throw new Error("Impossible de contacter le serveur. Vérifie ta connexion.");
      }
      throw err;
    }
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
      if (message.toLowerCase().includes("unauthorized")) await logout();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const login = async () => {
    if (!ensureApi()) return;
    if (!email.trim() || password.length < 6) {
      Alert.alert("Authentification", "Email requis et mot de passe de 6 caractères minimum.");
      return;
    }
    setBusyAction("auth");
    setLoginLoading(true);
    setError("");
    try {
      if (authMode === "register") {
        await requestJson("/auth/register", {
          method: "POST",
          body: JSON.stringify({ email: email.trim(), password }),
        });
        Alert.alert("Compte créé", "Vous pouvez maintenant vous connecter.");
        setAuthMode("login");
      }
      const data = await requestJson("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: email.trim(), password }),
      });
      await SecureStore.setItemAsync("token", data.access_token);
      setToken(data.access_token);
      await bootstrap(data.access_token);
    } catch (err) {
      Alert.alert("Authentification", err instanceof Error ? err.message : "Échec de connexion");
    } finally {
      setBusyAction("");
      setLoginLoading(false);
    }
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync("token");
    setToken("");
    setProfile(null);
    setLatest(null);
    setNotifications([]);
    setRoadmaps([]);
    setChatMessages([
      { id: "welcome", role: "assistant", content: "Bonjour 👋 Je suis ton assistant d'orientation. Pose-moi des questions sur tes choix, tes scores ou tes roadmaps !" },
    ]);
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
        headers: { ...headers },
        body: JSON.stringify(payload),
      });
      setProfile(data);
      await loadRoadmaps(data?.bacType);
      Alert.alert("✅ Profil", "Profil enregistré avec succès.");
    } catch (err) {
      Alert.alert("Profil", err instanceof Error ? err.message : "Mise à jour impossible.");
    } finally {
      setBusyAction("");
    }
  };

  const submitTest = async () => {
    if (questions.length === 0) {
      Alert.alert("Test", "Questions non chargées.");
      return;
    }
    const answered = questions.filter((q) => (answers[q.id] ?? 0) > 0).length;
    if (answered < questions.length) {
      Alert.alert("Test incomplet", `Tu as répondu à ${answered}/${questions.length} questions. Réponds à toutes avant d'enregistrer.`);
      return;
    }
    const payload = {
      answers: questions.map((question) => ({
        questionId: question.id,
        label: question.label,
        value: answers[question.id] ?? 0,
        domains: question.domains,
        skills: question.skills,
      })),
    };
    setBusyAction("test");
    try {
      const data = await requestJson("/orientation-test/submit", {
        method: "POST",
        headers: { ...headers },
        body: JSON.stringify(payload),
      });
      setLatest(data.test);
      Alert.alert("✅ Test terminé", "Tes résultats ont été enregistrés.");
    } catch (err) {
      Alert.alert("Test", err instanceof Error ? err.message : "Enregistrement impossible.");
    } finally {
      setBusyAction("");
    }
  };

  const downloadReport = async () => {
    const reportId = latest?.report?.id;
    if (!reportId) {
      Alert.alert("Rapport", "Aucun rapport disponible. Passe d'abord le test d'orientation.");
      return;
    }
    setBusyAction("report");
    try {
      const target = `${FileSystem.documentDirectory}orientation-report-${reportId}.pdf`;
      const result = await FileSystem.downloadAsync(
        `${API_BASE_URL}/reports/${reportId}/pdf`,
        target,
        { headers }
      );
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(result.uri);
      } else {
        Alert.alert("📄 Téléchargé", `Le rapport a été téléchargé.`);
      }
    } catch {
      Alert.alert("Rapport PDF", "Téléchargement impossible.");
    } finally {
      setBusyAction("");
    }
  };

  const askChat = async () => {
    const message = chatMessage.trim();
    if (!message) return;
    setChatMessage("");
    const userMsg: ChatMessage = { id: `${Date.now()}-u`, role: "user", content: message };
    setChatMessages((items) => [...items, userMsg]);
    setBusyAction("chat");
    try {
      const data = await requestJson("/chatbot/ask", {
        method: "POST",
        body: JSON.stringify({
          message,
          studentData: { bacType: profile?.bacType, score: profile?.FG, name: profile?.name },
        }),
      });
      const reply = data.reply ?? data.response ?? "Je n'ai pas compris ta question. Peux-tu reformuler ?";
      setChatMessages((items) => [...items, { id: `${Date.now()}-a`, role: "assistant", content: reply }]);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Service indisponible";
      setChatMessages((items) => [...items, {
        id: `${Date.now()}-err`,
        role: "assistant",
        content: `❌ Désolé, je n'ai pas pu répondre. ${errMsg}`,
      }]);
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

  const handleRoadmapDetail = useCallback((item: any) => {
    setShowRoadmapDetail(item);
  }, []);

  // ===== AUTH SCREEN =====
  if (!token) {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: theme.bg }]}>
        <StatusBar barStyle={theme.dark ? "light-content" : "dark-content"} />
        <ScrollView contentContainerStyle={styles.authShell} keyboardShouldPersistTaps="handled">
          <View style={{ alignItems: "center", marginBottom: 20 }}>
            <View style={[styles.brandMark, shadowStyle(theme)]}>
              <Text style={styles.brandText}>SO</Text>
            </View>
            <Text style={[styles.heroTitle, { color: theme.text }]}>Smart Orientation</Text>
            <Text style={[styles.heroSubtitle, { color: theme.muted }]}>
              {authMode === "login"
                ? "Connecte-toi pour retrouver ton parcours d'orientation."
                : "Crée ton espace et commence ton orientation personnalisée."}
            </Text>
          </View>

          <View style={[styles.card, shadowStyle(theme), { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={{ alignItems: "center", marginBottom: 8 }}>
              <Ionicons name={authMode === "login" ? "log-in-outline" : "person-add-outline"} size={32} color={theme.primary} />
              <Text style={[styles.heading, { color: theme.text, marginTop: 8 }]}>
                {authMode === "login" ? "Connexion" : "Inscription"}
              </Text>
            </View>

            <Input
              theme={theme}
              placeholder="Adresse email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              leftIcon="mail-outline"
            />
            <Input
              theme={theme}
              placeholder="Mot de passe"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              leftIcon="lock-closed-outline"
            />

            <ActionButton
              theme={theme}
              label={loginLoading ? "Patientez..." : authMode === "login" ? "Se connecter" : "Créer mon compte"}
              onPress={login}
              disabled={loginLoading}
              icon={authMode === "login" ? "log-in-outline" : "person-add-outline"}
              gradient
            />

            <Pressable onPress={() => setAuthMode(authMode === "login" ? "register" : "login")} style={styles.centerPress}>
              <Text style={[styles.link, { color: theme.primary }]}>
                {authMode === "login" ? "Créer un compte" : "J'ai déjà un compte"}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ===== MAIN APP =====
  const unreadCount = notifications.filter((n: any) => !n.readAt).length;

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={theme.dark ? "light-content" : "dark-content"} />
      <View style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.contentWithTabs}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={theme.primary} colors={[theme.primary]} />
          }
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Header
            theme={theme}
            screen={screen}
            profile={profile}
            onLogout={logout}
            unreadCount={unreadCount}
          />
          {loading && <SkeletonLoader theme={theme} />}
          {error ? <ErrorState theme={theme} message={error} onRetry={bootstrap} /> : null}
          <Animated.View style={{ opacity: fade, transform: [{ translateY: slideUp }] }}>
            {screen === "dashboard" && (
              <Dashboard
                theme={theme}
                profile={profile}
                form={profileForm}
                setForm={setProfileForm}
                latest={latest}
                busy={busyAction}
                loading={loading}
                onSave={saveProfile}
                onReport={downloadReport}
                onViewRoadmap={() => setScreen("roadmaps")}
              />
            )}
            {screen === "test" && (
              <Test
                theme={theme}
                questions={questions}
                answers={answers}
                setAnswers={setAnswers}
                busy={busyAction === "test"}
                onSubmit={submitTest}
                latest={latest}
              />
            )}
            {screen === "chatbot" && (
              <Chatbot
                theme={theme}
                chatMessage={chatMessage}
                setChatMessage={setChatMessage}
                messages={chatMessages}
                busy={busyAction === "chat"}
                onAsk={askChat}
                roadmaps={roadmaps}
                onViewRoadmap={handleRoadmapDetail}
              />
            )}
            {screen === "roadmaps" && (
              <Roadmaps
                theme={theme}
                roadmaps={roadmaps}
                onDetail={handleRoadmapDetail}
              />
            )}
            {screen === "notifications" && (
              <Notifications
                theme={theme}
                notifications={notifications}
                unreadCount={unreadCount}
                onRead={markNotificationRead}
                onRefresh={refresh}
              />
            )}
          </Animated.View>
        </ScrollView>

        <BottomTabs theme={theme} current={screen} onChange={setScreen} unreadCount={unreadCount} />
      </View>

      {/* Roadmap Detail Modal */}
      <Modal
        visible={!!showRoadmapDetail}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRoadmapDetail(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <View style={[styles.modalHandle, { backgroundColor: theme.border }]} />
            <ScrollView showsVerticalScrollIndicator={false}>
              {showRoadmapDetail && (
                <RoadmapDetailView
                  theme={theme}
                  item={showRoadmapDetail}
                  onClose={() => setShowRoadmapDetail(null)}
                />
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ===================== COMPONENTS =====================

// HEADER
function Header({
  theme,
  screen,
  profile,
  onLogout,
  unreadCount,
}: {
  theme: Theme;
  screen: Screen;
  profile: Profile | null;
  onLogout: () => void;
  unreadCount: number;
}) {
  const title = SCREENS.find((item) => item.id === screen)?.label ?? "Accueil";
  return (
    <View style={styles.header}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.eyebrow, { color: theme.muted }]}>Smart Orientation</Text>
        <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
        <Text style={[styles.subtitle, { color: theme.muted }]}>
          {profile?.name ? `Bonjour ${profile.name}` : "Connecté"}
        </Text>
      </View>
      <View style={{ flexDirection: "row", gap: 8 }}>
        {unreadCount > 0 && (
          <View style={[styles.badgeSmall, { backgroundColor: theme.danger }]}>
            <Text style={styles.badgeSmallText}>{unreadCount > 9 ? "9+" : unreadCount}</Text>
          </View>
        )}
        <Pressable
          onPress={onLogout}
          style={({ pressed }) => [
            styles.iconButton,
            { backgroundColor: theme.surface, borderColor: theme.border, opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Ionicons name="log-out-outline" size={20} color={theme.text} />
        </Pressable>
      </View>
    </View>
  );
}

// DASHBOARD
function Dashboard({
  theme,
  profile,
  form,
  setForm,
  latest,
  busy,
  loading,
  onSave,
  onReport,
  onViewRoadmap,
}: any) {
  const domains = Array.isArray(latest?.dominantDomains) ? latest.dominantDomains : [];
  const maxScore = Math.max(...domains.map((item: any) => Number(item.score) || 0), 1);
  const hasProfile = profile?.name || profile?.bacType;
  const completion = profile
    ? Math.round(
        ([profile.name, profile.bacType, profile.bacAverage, profile.gov].filter(Boolean).length / 4) * 100
      )
    : 0;

  return (
    <View style={styles.stack}>
      {/* Hero Card */}
      <View style={[styles.heroCard, shadowStyle(theme)]}>
        <View style={styles.heroGlow1} />
        <View style={styles.heroGlow2} />
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroCardLabel}>🎯 Recommendation principale</Text>
            <Text style={styles.heroCardTitle}>
              {domains[0]?.domain ?? "Complète ton test"}
            </Text>
            <Text style={styles.heroCardText}>
              Bac {profile?.bacType ?? "-"} · FG {profile?.FG ?? "-"}
            </Text>
          </View>
          <View style={[styles.heroBadge, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
            <Text style={styles.heroBadgeText}>{completion}%</Text>
          </View>
        </View>
        <View style={[styles.heroProgress, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
          <View style={[styles.heroProgressFill, { width: `${completion}%`, backgroundColor: "#fff" }]} />
        </View>
      </View>

      {/* Stats Grid */}
      <View style={styles.analyticsGrid}>
        <MetricCard
          theme={theme}
          icon="school-outline"
          label="Moyenne Bac"
          value={profile?.bacAverage ? `${profile.bacAverage}` : "-"}
          color={theme.primary}
        />
        <MetricCard
          theme={theme}
          icon="trending-up-outline"
          label="Score FG"
          value={profile?.FG ? `${profile.FG}` : "-"}
          color={theme.success}
        />
        <MetricCard
          theme={theme}
          icon="ribbon-outline"
          label="Test"
          value={latest?.id ? "✅" : "❌"}
          color={theme.warning}
        />
      </View>

      {/* Quick Actions */}
      {!latest?.id && !loading && (
        <Pressable
          onPress={onViewRoadmap}
          style={[styles.quickActionCard, { backgroundColor: theme.primarySoft, borderColor: theme.primary }]}
        >
          <View style={{ flex: 1 }}>
            <Text style={[styles.cardTitle, { color: theme.primary }]}>Passe le test d'orientation</Text>
            <Text style={[styles.mutedText, { color: theme.primary, opacity: 0.7 }]}>
              Découvre les filières qui te correspondent
            </Text>
          </View>
          <Ionicons name="arrow-forward-circle" size={32} color={theme.primary} />
        </Pressable>
      )}

      {/* Dominant Domains */}
      <Card theme={theme}>
        <SectionTitle
          theme={theme}
          icon="analytics-outline"
          title="Domaines recommandés"
          right={domains.length > 0 ? `${domains.length}` : undefined}
        />
        {domains.length === 0 ? (
          <EmptyState
            theme={theme}
            icon="analytics-outline"
            title="Aucun résultat"
            text="Passe le test d'orientation pour générer tes recommandations personnalisées."
            compact
          />
        ) : (
          domains.slice(0, 4).map((item: any, index: number) => {
            const percent = Math.round(((Number(item.score) || 0) / maxScore) * 100);
            return (
              <ProgressRow
                key={item.domain}
                theme={theme}
                label={item.domain}
                value={percent}
                color={ACCENTS[index % ACCENTS.length]}
                meta={`${item.score}`}
              />
            );
          })
        )}
        {latest?.report?.id && (
          <ActionButton
            theme={theme}
            label={busy === "report" ? "Préparation..." : "📄 Télécharger le rapport PDF"}
            onPress={onReport}
            disabled={busy === "report"}
            icon="download-outline"
          />
        )}
      </Card>

      {/* Profile Form */}
      <Card theme={theme}>
        <SectionTitle theme={theme} icon="person-outline" title="Mon Profil" right={completion > 0 ? `${completion}%` : undefined} />
        <Input
          theme={theme}
          placeholder="Nom complet"
          value={form.name}
          onChangeText={(value: string) => setForm((current: any) => ({ ...current, name: value }))}
          leftIcon="person-outline"
        />
        <View style={{ marginVertical: 4 }}>
          <Text style={[styles.fieldLabel, { color: theme.muted }]}>Type de Bac</Text>
          <ChipGroup
            values={BAC_TYPES}
            selected={form.bacType}
            onSelect={(type) => setForm((current: any) => ({ ...current, bacType: type }))}
            theme={theme}
          />
        </View>
        <View style={styles.twoColumns}>
          {([
            ["bacAverage", "Moyenne"],
            ["french", "Français"],
            ["english", "Anglais"],
            ["math", "Mathématiques"],
            ["physics", "Physique"],
            ["svt", "SVT"],
          ] as const).map(([key, label]) => (
            <Input
              key={key}
              theme={theme}
              placeholder={label}
              keyboardType="decimal-pad"
              value={form[key]}
              onChangeText={(value: string) => setForm((current: any) => ({ ...current, [key]: value }))}
              compact
            />
          ))}
        </View>
        <Input
          theme={theme}
          placeholder="Gouvernorat"
          value={form.gov}
          onChangeText={(value: string) => setForm((current: any) => ({ ...current, gov: value }))}
          leftIcon="location-outline"
        />
        <ActionButton
          theme={theme}
          label={busy === "profile" ? "Enregistrement..." : "💾 Enregistrer le profil"}
          onPress={onSave}
          disabled={busy === "profile"}
          icon="checkmark-circle-outline"
        />
      </Card>
    </View>
  );
}

// TEST
function Test({ theme, questions, answers, setAnswers, busy, onSubmit, latest }: any) {
  const answered = questions.filter((q: Question) => (answers[q.id] ?? 0) > 0).length;
  const progress = questions.length ? Math.round((answered / questions.length) * 100) : 0;
  const results = Array.isArray(latest?.dominantDomains) ? latest.dominantDomains : [];
  const maxScore = Math.max(...results.map((item: any) => Number(item.score) || 0), 1);
  const scrollRef = useRef<ScrollView>(null);

  return (
    <View style={styles.stack}>
      <Card theme={theme}>
        <SectionTitle
          theme={theme}
          icon="options-outline"
          title="Test d'orientation"
          right={questions.length > 0 ? `${answered}/${questions.length}` : undefined}
        />
        <ProgressBar theme={theme} value={progress} color={theme.primary} />
        {progress > 0 && progress < 100 && (
          <Text style={[styles.mutedText, { color: theme.muted, textAlign: "center" }]}>
            {progress}% complété - Réponds à toutes les questions
          </Text>
        )}

        {questions.length === 0 ? (
          <SkeletonLoader theme={theme} compact />
        ) : (
          <ScrollView
            ref={scrollRef}
            style={{ maxHeight: 460 }}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled
          >
            {questions.map((question: Question, index: number) => (
              <View
                key={question.id}
                style={[
                  styles.questionCard,
                  {
                    borderColor: answers[question.id] ? theme.primary : theme.border,
                    backgroundColor: answers[question.id] ? theme.primarySoft : theme.surfaceSoft,
                  },
                ]}
              >
                <View style={styles.questionHeader}>
                  <View style={[styles.questionNumber, { backgroundColor: answers[question.id] ? theme.primary : theme.surface, borderColor: theme.border }]}>
                    <Text style={[styles.questionIndex, { color: answers[question.id] ? "#fff" : theme.muted }]}>
                      {index + 1}
                    </Text>
                  </View>
                  <Text style={[styles.questionText, { color: theme.text }]}>{question.label}</Text>
                </View>
                <ScoreSlider
                  theme={theme}
                  value={answers[question.id] ?? 0}
                  onChange={(value: number) => setAnswers((current: any) => ({ ...current, [question.id]: value }))}
                />
              </View>
            ))}
          </ScrollView>
        )}

        <ActionButton
          theme={theme}
          label={busy ? "Enregistrement..." : "📝 Enregistrer le test"}
          onPress={onSubmit}
          disabled={busy || questions.length === 0}
          icon="send-outline"
        />
      </Card>

      {results.length > 0 && (
        <Card theme={theme}>
          <SectionTitle theme={theme} icon="ribbon-outline" title="Résultats du test" />
          {results.slice(0, 4).map((item: any, index: number) => {
            const percent = Math.round(((Number(item.score) || 0) / maxScore) * 100);
            return (
              <DomainResultCard
                key={item.domain}
                theme={theme}
                item={item}
                percent={percent}
                index={index}
              />
            );
          })}
        </Card>
      )}
    </View>
  );
}

// CHATBOT
function Chatbot({ theme, chatMessage, setChatMessage, messages, busy, onAsk, roadmaps, onViewRoadmap }: any) {
  const scrollRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages, busy]);

  const handleSend = () => {
    if (chatMessage.trim() && !busy) {
      onAsk();
      inputRef.current?.focus();
    }
  };

  return (
    <View style={[styles.chatContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={[styles.chatHeader, { borderBottomColor: theme.border }]}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View style={[styles.chatAvatar, { backgroundColor: theme.primary }]}>
            <Ionicons name="sparkles" size={18} color="#fff" />
          </View>
          <View>
            <Text style={[styles.cardTitle, { color: theme.text }]}>Assistant IA</Text>
            <Text style={[styles.mutedText, { color: busy ? theme.primary : theme.success, fontSize: 11 }]}>
              {busy ? "En train d'écrire..." : "En ligne"}
            </Text>
          </View>
        </View>
        {busy && <ActivityIndicator size="small" color={theme.primary} />}
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.chatPane}
        contentContainerStyle={styles.chatContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {messages.length === 0 && (
          <EmptyState
            theme={theme}
            icon="chatbubble-ellipses-outline"
            title="Commence la conversation"
            text="Pose une question sur ton orientation"
            compact
          />
        )}
        {messages.map((message: ChatMessage) => (
          <ChatBubble key={message.id} theme={theme} message={message} />
        ))}
        {busy && <TypingIndicator theme={theme} />}
      </ScrollView>

      {/* Roadmap Suggestions */}
      {roadmaps.length > 0 && !busy && (
        <View style={{ paddingHorizontal: 12, paddingVertical: 8 }}>
          <Text style={[styles.mutedText, { color: theme.muted, marginBottom: 8, fontSize: 11, fontWeight: "800", textTransform: "uppercase" }]}>
            Roadmaps disponibles
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
            {roadmaps.slice(0, 5).map((item: any, index: number) => (
              <Pressable
                key={item.domain ?? item.field ?? index}
                onPress={() => onViewRoadmap?.(item)}
                style={({ pressed }) => [
                  styles.chatRoadmapCard,
                  {
                    backgroundColor: theme.surfaceSoft,
                    borderColor: theme.border,
                    opacity: pressed ? 0.8 : 1,
                    transform: [{ scale: pressed ? 0.97 : 1 }],
                  },
                ]}
              >
                <Text style={styles.chatRoadmapIcon}>{item.icon ?? "📚"}</Text>
                <Text style={[styles.chatRoadmapTitle, { color: theme.text }]} numberOfLines={1}>
                  {item.field ?? item.domain}
                </Text>
                <Text style={[styles.chatRoadmapMeta, { color: theme.muted }]} numberOfLines={1}>
                  {item.demand ?? "Voir la roadmap"}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      <View style={[styles.chatInputBar, { backgroundColor: theme.surfaceSoft, borderColor: theme.border }]}>
        <TextInput
          ref={inputRef}
          style={[styles.chatInput, { color: theme.text }]}
          placeholder="Pose une question..."
          placeholderTextColor={theme.muted}
          value={chatMessage}
          onChangeText={setChatMessage}
          multiline
          maxLength={500}
          onSubmitEditing={handleSend}
          blurOnSubmit
        />
        <Pressable
          onPress={handleSend}
          disabled={busy || !chatMessage.trim()}
          style={({ pressed }) => [
            styles.sendButton,
            {
              opacity: busy || !chatMessage.trim() ? 0.5 : pressed ? 0.8 : 1,
              backgroundColor: theme.primary,
              transform: [{ scale: pressed ? 0.95 : 1 }],
            },
          ]}
        >
          {busy ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="send" size={18} color="#fff" />
          )}
        </Pressable>
      </View>
    </View>
  );
}

// ROADMAPS
function Roadmaps({ theme, roadmaps, onDetail }: { theme: Theme; roadmaps: any[]; onDetail: (item: any) => void }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (roadmaps.length === 0) {
    return (
      <Card theme={theme}>
        <SectionTitle theme={theme} icon="map-outline" title="Roadmaps" />
        <EmptyState
          theme={theme}
          icon="map-outline"
          title="Aucune roadmap"
          text="Les roadmaps apparaîtront après avoir synchronisé ton profil."
        />
      </Card>
    );
  }

  return (
    <View style={styles.stack}>
      <Card theme={theme}>
        <SectionTitle
          theme={theme}
          icon="map-outline"
          title="Parcours recommandés"
          right={`${roadmaps.length}`}
        />
        <Text style={[styles.mutedText, { color: theme.muted, marginBottom: 4 }]}>
          Clique sur une roadmap pour voir les détails
        </Text>

        {roadmaps.map((item: any, index: number) => {
          const key = item.domain ?? item.field ?? String(index);
          const open = expanded === key;
          const color = ACCENTS[index % ACCENTS.length];

          return (
            <Pressable
              key={key}
              onPress={() => {
                setExpanded(open ? null : key);
              }}
              style={({ pressed }) => [
                styles.roadmapCard,
                {
                  borderColor: open ? color : theme.border,
                  backgroundColor: theme.surfaceSoft,
                  opacity: pressed ? 0.9 : 1,
                },
              ]}
            >
              <View style={{ flexDirection: "row", gap: 14, alignItems: "flex-start" }}>
                <View style={[styles.roadmapIconBox, { backgroundColor: color }]}>
                  <Ionicons name={item.icon === ">" ? "map" : "map-outline"} size={20} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.rowBetween}>
                    <Text style={[styles.cardTitle, { color: theme.text, flex: 1 }]}>{item.field ?? item.domain}</Text>
                    <Ionicons name={open ? "chevron-up-circle" : "chevron-down-circle"} size={22} color={color} />
                  </View>
                  <Text style={[styles.mutedText, { color: theme.muted, marginTop: 4 }]}>
                    {item.description ?? item.demand ?? "Parcours recommandé"}
                  </Text>
                  <View style={{ marginTop: 8 }}>
                    <ProgressBar theme={theme} value={item.relevanceScore ?? 70 + index * 3} color={color} />
                  </View>

                  {/* Tags */}
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                    {item.difficulty && <Tag theme={theme} text={item.difficulty} color={color} />}
                    {item.demand && <Tag theme={theme} text={item.demand} color={theme.success} />}
                  </View>

                  {open && (
                    <View style={[styles.expandedBlock, { borderTopColor: theme.border }]}>
                      <Text style={[styles.bodyText, { color: theme.text }]}>
                        {item.description ?? "Parcours complet avec étapes progressives."}
                      </Text>
                      <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.mutedText, { color: theme.muted, fontSize: 11 }]}>Difficulté</Text>
                          <Text style={[styles.cardTitle, { color: theme.text, fontSize: 13 }]}>{item.difficulty ?? "Progressif"}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.mutedText, { color: theme.muted, fontSize: 11 }]}>Demande</Text>
                          <Text style={[styles.cardTitle, { color: theme.text, fontSize: 13 }]}>{item.demand ?? "Élevée"}</Text>
                        </View>
                      </View>
                      <Pressable
                        onPress={() => onDetail(item)}
                        style={[styles.inlineButton, { backgroundColor: color }]}
                      >
                        <Text style={styles.inlineButtonText}>Voir les détails complets</Text>
                        <Ionicons name="arrow-forward" size={14} color="#fff" />
                      </Pressable>
                    </View>
                  )}
                </View>
              </View>
            </Pressable>
          );
        })}
      </Card>
    </View>
  );
}

// ROADMAP DETAIL VIEW (inside modal)
function RoadmapDetailView({ theme, item, onClose }: { theme: Theme; item: any; onClose: () => void }) {
  const sections = [
    { title: "Débutant", icon: "seedling-outline", color: "#10b981", items: ["Concepts de base", "Introduction au domaine", "Ressources d'apprentissage"] },
    { title: "Intermédiaire", icon: "trending-up-outline", color: "#f59e0b", items: ["Projets pratiques", "Exercices avancés", "Mise en situation"] },
    { title: "Avancé", icon: "rocket-outline", color: "#8b5cf6", items: ["Spécialisation", "Portfolio", "Certification"] },
  ];

  return (
    <View style={{ padding: 4 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <Text style={[styles.heading, { color: theme.text, flex: 1 }]}>{item.field ?? item.domain}</Text>
        <Pressable onPress={onClose} style={[styles.closeButton, { backgroundColor: theme.surfaceSoft }]}>
          <Ionicons name="close" size={22} color={theme.text} />
        </Pressable>
      </View>

      <View style={[styles.detailHeader, { backgroundColor: theme.surfaceSoft }]}>
        <Text style={[styles.mutedText, { color: theme.muted }]}>Description</Text>
        <Text style={[styles.bodyText, { color: theme.text, marginTop: 4 }]}>
          {item.description ?? item.demand ?? "Parcours complet pour maîtriser ce domaine"}
        </Text>
      </View>

      {/* Progress */}
      <View style={{ marginVertical: 16 }}>
        <View style={styles.rowBetween}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Progression recommandée</Text>
          <Text style={[styles.badgeText, { color: theme.primary }]}>{item.relevanceScore ?? 75}%</Text>
        </View>
        <ProgressBar theme={theme} value={item.relevanceScore ?? 75} color={theme.primary} />
      </View>

      {/* Sections */}
      {sections.map((section, idx) => (
        <View key={idx} style={[styles.sectionCard, { backgroundColor: theme.surfaceSoft, borderColor: theme.border }]}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Ionicons name={section.icon as any} size={22} color={section.color} />
            <Text style={[styles.cardTitle, { color: theme.text }]}>{section.title}</Text>
          </View>
          {section.items.map((itemText, i) => (
            <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 }}>
              <View style={[styles.bulletDot, { backgroundColor: section.color }]} />
              <Text style={[styles.bodyText, { color: theme.muted }]}>{itemText}</Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

// NOTIFICATIONS
function Notifications({ theme, notifications, unreadCount, onRead, onRefresh }: any) {
  return (
    <Card theme={theme}>
      <SectionTitle
        theme={theme}
        icon="notifications-outline"
        title="Notifications"
        right={unreadCount > 0 ? `${unreadCount} non lue(s)` : undefined}
      />
      {notifications.length === 0 ? (
        <EmptyState
          theme={theme}
          icon="mail-open-outline"
          title="Boîte vide"
          text="Aucune notification pour le moment."
        />
      ) : (
        <>
          {unreadCount > 0 && (
            <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
              <Pressable onPress={onRefresh} style={[styles.linkButton, { borderColor: theme.primary }]}>
                <Ionicons name="refresh" size={14} color={theme.primary} />
                <Text style={[styles.linkButtonText, { color: theme.primary }]}>Actualiser</Text>
              </Pressable>
            </View>
          )}
          {notifications.map((item: any) => {
            const unread = !item.readAt;
            return (
              <Pressable
                key={item.id}
                onPress={() => onRead(item.id)}
                style={({ pressed }) => [
                  styles.notificationCard,
                  {
                    opacity: pressed ? 0.8 : 1,
                    backgroundColor: unread ? theme.primarySoft : theme.surfaceSoft,
                    borderColor: unread ? theme.primary : theme.border,
                  },
                ]}
              >
                <View
                  style={[
                    styles.notificationIcon,
                    {
                      backgroundColor: unread ? theme.primary : theme.surface,
                      borderColor: unread ? theme.primary : theme.border,
                    },
                  ]}
                >
                  <Ionicons
                    name={unread ? "mail-unread-outline" : "mail-open-outline"}
                    size={18}
                    color={unread ? "#fff" : theme.muted}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.rowBetween}>
                    <Text style={[styles.cardTitle, { color: theme.text, flex: 1 }]}>{item.title}</Text>
                    {item.createdAt && (
                      <Text style={[styles.mutedText, { color: theme.muted, fontSize: 11 }]}>{formatDate(item.createdAt)}</Text>
                    )}
                  </View>
                  <Text style={[styles.mutedText, { color: theme.muted, marginTop: 2 }]}>{item.message}</Text>
                </View>
                {unread && <View style={[styles.unreadDot, { backgroundColor: theme.primary }]} />}
              </Pressable>
            );
          })}
        </>
      )}
    </Card>
  );
}

// BOTTOM TABS
function BottomTabs({
  theme,
  current,
  onChange,
  unreadCount,
}: {
  theme: Theme;
  current: Screen;
  onChange: (screen: Screen) => void;
  unreadCount: number;
}) {
  return (
    <View style={[styles.bottomTabs, shadowStyle(theme), { backgroundColor: theme.surface, borderColor: theme.border }]}>
      {SCREENS.map((item) => {
        const active = current === item.id;
        const isNotif = item.id === "notifications";
        return (
          <Pressable
            key={item.id}
            onPress={() => onChange(item.id)}
            style={({ pressed }) => [
              styles.bottomTab,
              {
                backgroundColor: active ? theme.primary : "transparent",
                transform: [{ scale: pressed ? 0.95 : 1 }],
              },
            ]}
          >
            <View>
              <Ionicons
                name={active ? item.iconActive : item.icon}
                size={IS_SMALL ? 18 : 20}
                color={active ? "#fff" : theme.muted}
              />
              {isNotif && unreadCount > 0 && (
                <View style={[styles.tabBadge, { backgroundColor: theme.danger }]}>
                  <Text style={styles.tabBadgeText}>{unreadCount > 9 ? "9+" : unreadCount}</Text>
                </View>
              )}
            </View>
            <Text
              style={[
                styles.bottomTabText,
                { color: active ? "#fff" : theme.muted, fontSize: IS_SMALL ? 9 : 10 },
              ]}
              numberOfLines={1}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ===================== UI COMPONENTS =====================

function Input({ theme, compact, style, leftIcon, ...props }: any) {
  const inputRef = useRef<TextInput>(null);
  return (
    <Pressable
      onPress={() => inputRef.current?.focus()}
      style={[
        styles.input,
        compact && styles.inputCompact,
        {
          color: theme.text,
          backgroundColor: theme.surfaceSoft,
          borderColor: theme.border,
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
        },
        style,
      ]}
    >
      {leftIcon && <Ionicons name={leftIcon} size={18} color={theme.muted} />}
      <TextInput
        ref={inputRef}
        {...props}
        placeholderTextColor={theme.muted}
        style={[styles.inputInner, { color: theme.text, flex: 1 }]}
      />
    </Pressable>
  );
}

function ActionButton({
  theme,
  label,
  onPress,
  disabled,
  icon,
  gradient,
}: {
  theme: Theme;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  gradient?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: gradient ? theme.primaryDark : theme.primary,
          opacity: disabled ? 0.5 : pressed ? 0.88 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}
    >
      {icon && <Ionicons name={icon} size={18} color="#fff" />}
      <Text style={styles.buttonText}>{label}</Text>
      {disabled && <ActivityIndicator size="small" color="#fff" style={{ marginLeft: 6 }} />}
    </Pressable>
  );
}

function Card({ theme, children, fill }: { theme: Theme; children: React.ReactNode; fill?: boolean }) {
  return (
    <View
      style={[
        styles.card,
        fill && styles.fillCard,
        shadowStyle(theme),
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}
    >
      {children}
    </View>
  );
}

function SectionTitle({
  theme,
  icon,
  title,
  right,
}: {
  theme: Theme;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  right?: string;
}) {
  return (
    <View style={styles.sectionTitle}>
      <View style={styles.inline}>
        <View style={[styles.sectionIcon, { backgroundColor: theme.primarySoft }]}>
          <Ionicons name={icon} size={18} color={theme.primary} />
        </View>
        <Text style={[styles.heading, { color: theme.text }]}>{title}</Text>
      </View>
      {right && (
        <View style={[styles.sectionBadge, { backgroundColor: theme.primarySoft }]}>
          <Text style={[styles.badgeText, { color: theme.primary }]}>{right}</Text>
        </View>
      )}
    </View>
  );
}

function MetricCard({
  theme,
  icon,
  label,
  value,
  color,
}: {
  theme: Theme;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: any;
  color: string;
}) {
  return (
    <View
      style={[
        styles.metricCard,
        shadowStyle(theme),
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}
    >
      <View style={[styles.metricIcon, { backgroundColor: theme.primarySoft }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text style={[styles.metricValue, { color: theme.text }]}>{String(value)}</Text>
      <Text style={[styles.mutedText, { color: theme.muted, fontSize: 11 }]}>{label}</Text>
    </View>
  );
}

function ProgressRow({
  theme,
  label,
  value,
  color,
  meta,
}: {
  theme: Theme;
  label: string;
  value: number;
  color: string;
  meta?: string;
}) {
  return (
    <View style={styles.progressRow}>
      <View style={styles.rowBetween}>
        <Text style={[styles.cardTitle, { color: theme.text, flex: 1 }]} numberOfLines={1}>
          {label}
        </Text>
        <Text style={[styles.mutedText, { color: theme.muted }]}>{meta ?? `${value}%`}</Text>
      </View>
      <ProgressBar theme={theme} value={value} color={color} />
    </View>
  );
}

function ProgressBar({
  theme,
  value,
  color,
}: {
  theme: Theme;
  value: number;
  color: string;
}) {
  return (
    <View style={[styles.progressTrack, { backgroundColor: theme.dark ? "#1e293b" : "#e2e8f0" }]}>
      <View
        style={[
          styles.progressFill,
          { width: `${Math.max(2, Math.min(100, value))}%`, backgroundColor: color },
        ]}
      />
    </View>
  );
}

function ChipGroup({
  values,
  selected,
  onSelect,
  theme,
}: {
  values: string[];
  selected: string;
  onSelect: (value: string) => void;
  theme: Theme;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipWrap}>
      {values.map((value) => {
        const active = selected === value;
        return (
          <Pressable
            key={value}
            onPress={() => onSelect(value)}
            style={({ pressed }) => [
              styles.chip,
              {
                backgroundColor: active ? theme.primary : theme.surfaceSoft,
                borderColor: active ? theme.primary : theme.border,
                transform: [{ scale: pressed ? 0.95 : 1 }],
              },
            ]}
          >
            <Text
              style={[
                styles.chipText,
                { color: active ? "#fff" : theme.text },
              ]}
            >
              {value}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function ScoreSlider({
  theme,
  value,
  onChange,
}: {
  theme: Theme;
  value: number;
  onChange: (value: number) => void;
}) {
  const maxVal = 5;
  return (
    <View>
      <View style={styles.scoreLabels}>
        {[1, 2, 3, 4, 5].map((score) => (
          <Text
            key={score}
            style={[
              styles.scoreLabelText,
              { color: value >= score ? theme.primary : theme.muted },
            ]}
          >
            {score}
          </Text>
        ))}
      </View>
      <View style={styles.scoreChoices}>
        {[1, 2, 3, 4, 5].map((score) => {
          const active = value >= score;
          return (
            <Pressable
              key={score}
              onPress={() => onChange(score)}
              style={({ pressed }) => [
                styles.scoreDot,
                {
                  backgroundColor: active ? theme.primary : theme.surface,
                  borderColor: active ? theme.primary : theme.border,
                  transform: [{ scale: pressed ? 0.9 : 1 }],
                },
              ]}
            >
              <Text
                style={[
                  styles.scoreText,
                  { color: active ? "#fff" : theme.muted },
                ]}
              >
                {score}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 4 }}>
        <Text style={[styles.mutedText, { color: theme.muted, fontSize: 10 }]}>Pas du tout</Text>
        <Text style={[styles.mutedText, { color: theme.muted, fontSize: 10 }]}>Totalement</Text>
      </View>
    </View>
  );
}

function DomainResultCard({
  theme,
  item,
  percent,
  index,
}: {
  theme: Theme;
  item: any;
  percent: number;
  index: number;
}) {
  const color = ACCENTS[index % ACCENTS.length];
  return (
    <View
      style={[
        styles.domainResult,
        { backgroundColor: theme.surfaceSoft, borderColor: theme.border },
      ]}
    >
      <View style={styles.rowBetween}>
        <View style={styles.inline}>
          <View style={[styles.resultIcon, { backgroundColor: color }]}>
            <Ionicons name="ribbon-outline" size={18} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>{item.domain}</Text>
            <Text style={[styles.mutedText, { color: theme.muted }]}>
          Compatibilité {percent}%
            </Text>
          </View>
        </View>
        {index === 0 && (
          <View style={[styles.topBadge, { backgroundColor: color }]}>
            <Ionicons name="star" size={12} color="#fff" />
            <Text style={styles.topBadgeText}>Top</Text>
          </View>
        )}
      </View>
      <ProgressBar theme={theme} value={percent} color={color} />
    </View>
  );
}

function ChatBubble({ theme, message }: { theme: Theme; message: ChatMessage }) {
  const user = message.role === "user";
  return (
    <View style={[styles.messageRow, user && styles.messageRowUser]}>
      {!user && (
        <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
          <Ionicons name="sparkles" size={14} color="#fff" />
        </View>
      )}
      <View
        style={[
          styles.bubble,
          user ? styles.userBubble : styles.assistantBubble,
          { backgroundColor: user ? theme.primary : theme.surfaceSoft },
        ]}
      >
        {user && (
          <Text style={[styles.bubbleMeta, { color: "rgba(255,255,255,0.7)" }]}>Toi</Text>
        )}
        <MarkdownText
          text={message.content}
          color={user ? "#fff" : theme.text}
          mutedColor={user ? "#dbeafe" : theme.muted}
        />
        <Text
          style={[
            styles.bubbleTime,
            { color: user ? "rgba(255,255,255,0.6)" : theme.muted },
          ]}
        >
          {new Date(Number(message.id.split("-")[0]) || Date.now()).toLocaleTimeString("fr-FR", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
      </View>
    </View>
  );
}

function MarkdownText({
  text,
  color,
  mutedColor,
}: {
  text: string;
  color: string;
  mutedColor: string;
}) {
  return (
    <View>
      {String(text || "")
        .split("\n")
        .map((line, lineIndex) => {
          const bullet = line.trim().startsWith("-") || line.trim().startsWith("*");
          const clean = bullet ? line.trim().slice(1).trim() : line;
          const isHeader =
            line.trim().startsWith("##") || line.trim().startsWith("**") && line.trim().endsWith("**");
          return (
            <Text
              key={lineIndex}
              style={[
                styles.markdownLine,
                { color },
                isHeader && { fontWeight: "900", fontSize: 15, marginTop: 4 },
              ]}
            >
              {bullet && <Text style={{ color: mutedColor }}>• </Text>}
              {clean.split(/(\*\*.*?\*\*)/g).map((part, index) =>
                part.startsWith("**") && part.endsWith("**") ? (
                  <Text key={index} style={styles.boldText}>
                    {part.slice(2, -2)}
                  </Text>
                ) : (
                  <Text key={index}>{part}</Text>
                )
              )}
            </Text>
          );
        })}
    </View>
  );
}

function TypingIndicator({ theme }: { theme: Theme }) {
  return (
    <View style={styles.typingRow}>
      <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
        <Ionicons name="sparkles" size={14} color="#fff" />
      </View>
      <View style={[styles.typingBubble, { backgroundColor: theme.surfaceSoft }]}>
        {[0, 1, 2].map((item) => (
          <View
            key={item}
            style={[
              styles.typingDot,
              {
                backgroundColor: theme.primary,
                opacity: 0.4 + item * 0.2,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

function SkeletonLoader({ theme, compact }: { theme: Theme; compact?: boolean }) {
  return (
    <View
      style={[
        styles.skeletonCard,
        compact && styles.skeletonCompact,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}
    >
      <View
        style={[
          styles.skeletonLine,
          { backgroundColor: theme.surfaceSoft, width: "45%" },
        ]}
      />
      <View
        style={[
          styles.skeletonLine,
          { backgroundColor: theme.surfaceSoft, width: "86%" },
        ]}
      />
      <View
        style={[
          styles.skeletonLine,
          { backgroundColor: theme.surfaceSoft, width: "68%" },
        ]}
      />
      <View
        style={[
          styles.skeletonLine,
          { backgroundColor: theme.surfaceSoft, width: "32%" },
        ]}
      />
    </View>
  );
}

function EmptyState({
  theme,
  icon,
  title,
  text,
  compact,
}: {
  theme: Theme;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  text: string;
  compact?: boolean;
}) {
  return (
    <View
      style={[
        styles.emptyState,
        compact && styles.emptyStateCompact,
        { backgroundColor: theme.surfaceSoft },
      ]}
    >
      <Ionicons name={icon} size={compact ? 24 : 32} color={theme.primary} />
      <Text style={[styles.cardTitle, { color: theme.text }]}>{title}</Text>
      <Text
        style={[
          styles.mutedText,
          { color: theme.muted, textAlign: "center" },
        ]}
      >
        {text}
      </Text>
    </View>
  );
}

function ErrorState({
  theme,
  message,
  onRetry,
}: {
  theme: Theme;
  message: string;
  onRetry?: () => void;
}) {
  return (
    <View
      style={[
        styles.errorState,
        {
          borderColor: theme.danger,
          backgroundColor: theme.dark ? "#3f1212" : "#fef2f2",
        },
      ]}
    >
      <Ionicons name="warning-outline" size={20} color={theme.danger} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.errorText, { color: theme.danger }]}>{message}</Text>
      </View>
      {onRetry && (
        <Pressable
          onPress={onRetry}
          style={[styles.retryButton, { backgroundColor: theme.danger }]}
        >
          <Ionicons name="refresh" size={14} color="#fff" />
          <Text style={styles.retryText}>Réessayer</Text>
        </Pressable>
      )}
    </View>
  );
}

function Tag({
  theme,
  text,
  color,
}: {
  theme: Theme;
  text: string;
  color?: string;
}) {
  return (
    <View
      style={[
        styles.tag,
        { backgroundColor: color ? `${color}20` : theme.primarySoft },
      ]}
    >
      <Text
        style={[
          styles.tagText,
          { color: color ?? theme.primary },
        ]}
      >
        {text}
      </Text>
    </View>
  );
}

function shadowStyle(theme: Theme) {
  return {
    shadowColor: theme.dark ? "#000" : "#0f172a",
    shadowOpacity: theme.dark ? 0.4 : 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: Platform.OS === "android" ? (theme.dark ? 8 : 4) : 5,
  };
}

// ===================== STYLES =====================
const styles = StyleSheet.create({
  screen: { flex: 1 },
  authShell: {
    flexGrow: 1,
    justifyContent: "center",
    padding: SCREEN_WIDTH < 370 ? 16 : 24,
    gap: 16,
  },
  contentWithTabs: {
    padding: SCREEN_WIDTH < 370 ? 12 : 16,
    gap: 16,
    paddingBottom: Platform.OS === "android" ? 120 : 108,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight ?? 24) + 4 : 0,
  },
  eyebrow: { fontSize: 11, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.8 },
  title: { fontSize: IS_SMALL ? 26 : 30, fontWeight: "900" },
  subtitle: { marginTop: 2, fontSize: 14, fontWeight: "500" },
  heroTitle: { fontSize: 30, fontWeight: "900", textAlign: "center", marginTop: 12 },
  heroSubtitle: { fontSize: 14, textAlign: "center", lineHeight: 22, paddingHorizontal: 20, marginTop: 4 },
  brandMark: {
    alignSelf: "center",
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: "#2563eb",
    alignItems: "center",
    justifyContent: "center",
  },
  brandText: { color: "#fff", fontWeight: "900", fontSize: 28 },

  // Cards
  card: { borderRadius: 24, padding: 16, gap: 14, borderWidth: 1 },
  fillCard: { minHeight: 520 },
  stack: { gap: 16 },

  // Hero Card
  heroCard: {
    overflow: "hidden",
    borderRadius: 28,
    padding: 22,
    minHeight: 160,
    backgroundColor: "#1d4ed8",
    justifyContent: "space-between",
  },
  heroGlow1: {
    position: "absolute",
    right: -40,
    top: -30,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  heroGlow2: {
    position: "absolute",
    right: 20,
    bottom: -50,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  heroCardLabel: { color: "#bfdbfe", fontSize: 11, fontWeight: "800", textTransform: "uppercase", letterSpacing: 1 },
  heroCardTitle: { color: "#fff", fontSize: IS_SMALL ? 24 : 28, fontWeight: "900", marginTop: 8 },
  heroCardText: { color: "#dbeafe", marginTop: 6, fontSize: 14, fontWeight: "700" },
  heroBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  heroBadgeText: { color: "#fff", fontWeight: "900", fontSize: 13 },
  heroProgress: { height: 5, borderRadius: 999, marginTop: 12, overflow: "hidden" },
  heroProgressFill: { height: "100%", borderRadius: 999 },

  // Analytics
  analyticsGrid: { flexDirection: "row", gap: 10 },
  metricCard: { flex: 1, borderRadius: 20, borderWidth: 1, padding: 13, gap: 8 },
  metricIcon: { width: 34, height: 34, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  metricValue: { fontSize: IS_SMALL ? 20 : 24, fontWeight: "900" },

  // Quick Action
  quickActionCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 16,
    gap: 12,
  },

  // Section
  sectionTitle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionIcon: { width: 34, height: 34, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  sectionBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  heading: { fontSize: 18, fontWeight: "900" },
  inline: { flexDirection: "row", alignItems: "center", gap: 10 },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  flex: { flex: 1 },
  fieldLabel: { fontSize: 12, fontWeight: "800", marginBottom: 4 },

  // Text
  mutedText: { fontSize: 13, lineHeight: 18 },
  bodyText: { fontSize: 13, lineHeight: 19 },
  cardTitle: { fontSize: 15, fontWeight: "800" },
  badgeText: { fontSize: 12, fontWeight: "900" },

  // Input
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  inputInner: { fontSize: 15, padding: 0 },
  inputCompact: { flex: 1, minWidth: "47%" },
  twoColumns: { flexDirection: "row", flexWrap: "wrap", gap: 10 },

  // Button
  button: {
    minHeight: 50,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
  },
  buttonText: { color: "#fff", fontWeight: "900", fontSize: 15 },
  link: { fontWeight: "800", fontSize: 14 },
  centerPress: { alignItems: "center", paddingVertical: 8 },
  iconButton: { width: 44, height: 44, borderRadius: 16, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  linkButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  linkButtonText: { fontSize: 12, fontWeight: "900" },
  inlineButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginTop: 12,
  },
  inlineButtonText: { color: "#fff", fontWeight: "800", fontSize: 13 },

  // Progress
  progressRow: { gap: 6 },
  progressTrack: { height: 8, borderRadius: 999, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 999 },

  // Chips
  chipWrap: { flexDirection: "row", gap: 8, paddingVertical: 4 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 9 },
  chipText: { fontSize: 12, fontWeight: "900" },

  // Questions
  questionCard: { borderRadius: 20, borderWidth: 1, padding: 14, gap: 10 },
  questionHeader: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  questionNumber: { width: 28, height: 28, borderRadius: 10, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  questionIndex: { fontWeight: "900", fontSize: 12 },
  questionText: { flex: 1, fontSize: 14, fontWeight: "700", lineHeight: 20 },

  // Score
  scoreLabels: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 4, marginBottom: 6 },
  scoreLabelText: { fontSize: 11, fontWeight: "800" },
  scoreChoices: { flexDirection: "row", justifyContent: "space-between" },
  scoreDot: { width: IS_SMALL ? 34 : 38, height: IS_SMALL ? 34 : 38, borderRadius: 14, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  scoreText: { fontWeight: "900", fontSize: 13 },

  // Domain Results
  domainResult: { borderRadius: 18, borderWidth: 1, padding: 13, gap: 10 },
  resultIcon: { width: 38, height: 38, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  topBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  topBadgeText: { color: "#fff", fontWeight: "900", fontSize: 10 },

  // Chat
  chatContainer: { borderRadius: 24, borderWidth: 1, overflow: "hidden" },
  chatHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderBottomWidth: 1,
  },
  chatAvatar: { width: 36, height: 36, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  chatPane: { maxHeight: 420, minHeight: 200 },
  chatContent: { gap: 10, padding: 14 },
  messageRow: { flexDirection: "row", alignItems: "flex-end", gap: 8, maxWidth: "88%" },
  messageRowUser: { alignSelf: "flex-end" },
  avatar: { width: 26, height: 26, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  bubble: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10, maxWidth: "100%" },
  userBubble: { borderBottomRightRadius: 4 },
  assistantBubble: { borderBottomLeftRadius: 4 },
  bubbleMeta: { fontSize: 9, fontWeight: "800", marginBottom: 4, textTransform: "uppercase" },
  bubbleTime: { fontSize: 9, marginTop: 4, textAlign: "right" },
  markdownLine: { fontSize: 14, lineHeight: 21 },
  boldText: { fontWeight: "900" },
  typingRow: { flexDirection: "row", alignItems: "center", gap: 8, padding: 4 },
  typingBubble: {
    flexDirection: "row",
    gap: 5,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderBottomLeftRadius: 4,
  },
  typingDot: { width: 8, height: 8, borderRadius: 4 },
  roadmapStrip: { gap: 10, paddingHorizontal: 4 },
  chatRoadmapCard: { width: 140, borderWidth: 1, borderRadius: 18, padding: 12, gap: 6 },
  chatRoadmapIcon: { fontSize: 22, textAlign: "center" },
  chatRoadmapTitle: { fontWeight: "900", fontSize: 13, textAlign: "center" },
  chatRoadmapMeta: { fontSize: 11, textAlign: "center" },
  chatInputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    borderWidth: 1,
    borderRadius: 20,
    padding: 8,
    margin: 8,
  },
  chatInput: { flex: 1, maxHeight: 80, minHeight: 34, paddingHorizontal: 8, paddingVertical: 6, fontSize: 15 },
  sendButton: { width: 40, height: 40, borderRadius: 14, alignItems: "center", justifyContent: "center" },

  // Roadmaps
  roadmapCard: { borderRadius: 20, borderWidth: 1, padding: 14, marginBottom: 10 },
  roadmapIconBox: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  expandedBlock: { marginTop: 12, paddingTop: 12, gap: 8, borderTopWidth: 1 },

  // Roadmap Detail
  detailHeader: { borderRadius: 18, padding: 16, marginBottom: 8 },
  sectionCard: { borderRadius: 18, borderWidth: 1, padding: 14, gap: 6, marginBottom: 10 },
  bulletDot: { width: 6, height: 6, borderRadius: 3 },

  // Tags
  tag: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  tagText: { fontSize: 11, fontWeight: "900" },

  // Notifications
  notificationCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderRadius: 20,
    padding: 13,
    marginBottom: 8,
  },
  notificationIcon: { width: 38, height: 38, borderRadius: 14, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  unreadDot: { width: 10, height: 10, borderRadius: 5 },

  // Empty & Error
  emptyState: { alignItems: "center", gap: 8, padding: 22, borderRadius: 18 },
  emptyStateCompact: { padding: 16, gap: 6 },
  errorState: { flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderRadius: 16, padding: 14 },
  errorText: { flex: 1, fontWeight: "700", fontSize: 13 },
  retryButton: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  retryText: { color: "#fff", fontWeight: "800", fontSize: 11 },

  // Skeleton
  skeletonCard: { borderRadius: 22, borderWidth: 1, padding: 16, gap: 12 },
  skeletonCompact: { padding: 12 },
  skeletonLine: { height: 14, borderRadius: 999 },

  // Badges
  badgeSmall: {
    position: "absolute",
    top: -4,
    right: 4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    zIndex: 10,
  },
  badgeSmallText: { color: "#fff", fontWeight: "900", fontSize: 10 },
  tabBadge: {
    position: "absolute",
    top: -4,
    right: -6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  tabBadgeText: { color: "#fff", fontWeight: "900", fontSize: 9 },

  // Bottom Tabs
  bottomTabs: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: Platform.OS === "android" ? 12 : 24,
    flexDirection: "row",
    gap: 4,
    borderRadius: 24,
    padding: 8,
    borderWidth: 1,
  },
  bottomTab: { flex: 1, minHeight: 52, borderRadius: 18, alignItems: "center", justifyContent: "center", gap: 3 },
  bottomTabText: { fontSize: 10, fontWeight: "900" },

  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    maxHeight: "85%",
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  closeButton: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center" },
});