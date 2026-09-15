import cv2
from paddleocr import PaddleOCR
ocr = PaddleOCR(use_angle_cls=True, lang='en', enable_mkldnn=False)
image = cv2.imread(r"C:\Users\royar\.gemini\antigravity-ide\brain\8f23b65b-9f6c-4434-a68a-a34c3bb4a81b\.user_uploaded\media_1789451657566.png")
result = ocr.ocr(image)

extracted_text = []
if hasattr(result[0], "get") and result[0].get("rec_texts"):
    extracted_text = result[0]["rec_texts"]
elif "rec_texts" in result[0]:
    extracted_text = result[0]["rec_texts"]
else:
    try:
        for line in result[0]:
            if len(line) > 1 and len(line[1]) > 0:
                text = line[1][0]
                extracted_text.append(text)
    except Exception:
        pass

print("\n--- EXTRACTED TEXT ---")
print("\n".join(extracted_text))
