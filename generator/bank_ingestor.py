import os
import json
import fitz  # PyMuPDF
from PIL import Image
import zipfile
from lxml import etree

class BankIngestor:
    def __init__(self, inbox_dir, bank_dir):
        self.inbox_dir = inbox_dir
        self.bank_dir = bank_dir
        self.image_dir = os.path.join(bank_dir, "images")

    def extract_from_pdf(self, file_path):
        """PDF에서 텍스트와 고해상도 페이지 이미지 추출"""
        doc = fitz.open(file_path)
        full_text = ""
        base_filename = os.path.splitext(os.path.basename(file_path))[0]
        
        for page_num, page in enumerate(doc):
            full_text += f"\n--- Page {page_num+1} ---\n"
            full_text += page.get_text()
            
            # 페이지를 고해상도 PNG로 렌더링 (분석용)
            zoom = 2.0  # 해상도 2배 확대
            mat = fitz.Matrix(zoom, zoom)
            pix = page.get_pixmap(matrix=mat)
            page_img_path = os.path.join(self.image_dir, f"page_{base_filename}_{page_num+1}.png")
            pix.save(page_img_path)
            print(f"📸 페이지 렌더링 완료: {page_img_path}")
            
            # 개별 이미지 개체 추출 (원본 소스 확보)
            for img_index, img in enumerate(page.get_images(full=True)):
                xref = img[0]
                base_image = doc.extract_image(xref)
                img_name = f"obj_{base_filename}_{page_num+1}_{img_index}.{base_image['ext']}"
                with open(os.path.join(self.image_dir, img_name), "wb") as f:
                    f.write(base_image["image"])
        return full_text

    def extract_from_hwpx(self, file_path):
        """HWPX(ZIP+XML)에서 텍스트 추출"""
        texts = []
        with zipfile.ZipFile(file_path, 'r') as z:
            # HWPX의 본문은 보통 Contents/section0.xml 등에 저장됨
            section_files = [f for f in z.namelist() if 'Contents/section' in f]
            for sec in section_files:
                with z.open(sec) as f:
                    tree = etree.parse(f)
                    # 모든 텍스트 노드 추출
                    for el in tree.xpath('//hp:t', namespaces={'hp': 'http://www.hancom.co.kr/hwpml/2011/paragraph'}):
                        if el.text:
                            texts.append(el.text)
        return "\n".join(texts)

    def process_inbox(self):
        files = [f for f in os.listdir(self.inbox_dir) if f.lower().endswith(('.pdf', '.hwpx', '.png', '.jpg'))]
        results = []
        
        for file_name in files:
            path = os.path.join(self.inbox_dir, file_name)
            print(f"🔍 처리 중: {file_name}")
            
            content = ""
            if file_name.lower().endswith('.pdf'):
                content = self.extract_from_pdf(path)
            elif file_name.lower().endswith('.hwpx'):
                content = self.extract_from_hwpx(path)
            
            results.append({
                "file": file_name,
                "raw_text": content
            })
        
        return results

if __name__ == "__main__":
    INBOX = "2026-mid3-Chem_Physics/generator/inbox"
    BANK = "2026-mid3-Chem_Physics/generator/data/bank"
    
    ingestor = BankIngestor(INBOX, BANK)
    data = ingestor.process_inbox()
    
    # 추출된 Raw 데이터를 텍스트 파일로 임시 저장 (Gemini가 읽어서 구조화할 용도)
    with open(os.path.join(BANK, "raw_extracted.txt"), "w", encoding="utf-8") as f:
        for item in data:
            f.write(f"\nFILE: {item['file']}\n")
            f.write(item['raw_text'])
            f.write("\n" + "="*50 + "\n")
    
    print(f"✅ 추출 완료. {len(data)}개의 파일 데이터가 raw_extracted.txt에 저장되었습니다.")
