import pdfplumber
import pandas as pd
import json
import numpy as np
import arabic_reshaper
from bidi.algorithm import get_display
def map_bac_type(text):
    text = str(text)

    # 🔥 دقيق الأول
    if "إعلامية" in text or "اعلامية" in text:
        return "INFO"

    if "اقتصاد" in text:
        return "ECO"

    if "تقنية" in text:
        return "TECH"

    if "رياضيات" in text:
        return "MATH"

    if "علوم" in text:
        return "SVT"

    if "آداب" in text or "اداب" in text:
        return "LETTRES"

    if "رياضة" in text:
        return "SPORT"

    # fallback
    return "LETTRES"

def fix_arabic_text(text):
    if not text or text == 'None':
        return ""
    reshaped_text = arabic_reshaper.reshape(str(text))
    return get_display(reshaped_text)

def extract_orientation_data(pdf_path, output_json_path):
    all_rows = []
    
    print("Reading PDF...")
    
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            tables = page.extract_tables()
            for table in tables:
                if not table: continue
                for row in table:
                    # تنظيف النصوص من الفراغات والأسطر الزائدة
                    clean_row = [str(cell).replace('\n', ' ').strip() if cell else "" for cell in row]
                    all_rows.append(clean_row)

    # ترتيب الأعمدة حسب دليل التوجيه التونسي
    columns = ["lastScore", "capacity", "formula", "bacType", "code", "specialties", "institution", "program"]
    df = pd.DataFrame(all_rows, columns=columns)
    
    # إزالة العناوين المكررة
    df = df[df['code'] != 'الرمز']
    
    # تعبئة الخلايا المدمجة (الرمز، المؤسسة، البرنامج)
    cols_to_fill = ["code", "program", "institution", "specialties", "formula"]
    df[cols_to_fill] = df[cols_to_fill].replace('', np.nan)
    df[cols_to_fill] = df[cols_to_fill].ffill()

    # حذف الصفوف التي لا تحتوي على نوع باكالوريا
    df = df.dropna(subset=['bacType', 'code'])

    result_json = []
    # تجميع البيانات حسب الرمز
    grouped = df.groupby('code')

    for code, group in grouped:
        first_row = group.iloc[0]
        
        # تصحيح النصوص العربية
        program_name = fix_arabic_text(first_row['program'])
        institution = fix_arabic_text(first_row['institution'])
        
        bac_types = []
        for _, row in group.iterrows():
            try:
                cap = int(float(row['capacity'])) if row['capacity'] else 0
            except: cap = 0
            
            try:
                score = float(row['lastScore']) if row['lastScore'] and row['lastScore'] != '-' else None
            except: score = None

            bac_types.append({
                "type": map_bac_type(row['bacType']),
                "capacity": cap,
                "lastScore": score
            })
            
        result_json.append({
            "code": str(code),
            "program": program_name,
            "institution": institution,
            "formula": str(first_row['formula']),
            "bacTypes": bac_types
        })

    with open(output_json_path, 'w', encoding='utf-8') as f:
        json.dump(result_json, f, ensure_ascii=False, indent=2)
    
    print("DONE")


import sys

if __name__ == "__main__":
    pdf_path = sys.argv[1]
    extract_orientation_data(pdf_path, "output.json")