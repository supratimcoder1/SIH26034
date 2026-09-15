import cv2
from paddleocr import PaddleOCR
ocr = PaddleOCR(use_angle_cls=True, lang='en', enable_mkldnn=False)
image = cv2.imread(r"C:\Users\royar\.gemini\antigravity-ide\brain\8f23b65b-9f6c-4434-a68a-a34c3bb4a81b\.user_uploaded\media_1789451338803.png")
res = ocr.ocr(image)
import pprint
print("Dict keys:")
try:
    print(res[0].keys())
except:
    pass
print("Attributes:")
print(dir(res[0]))
if hasattr(res[0], 'rec_text'):
    print(res[0].rec_text[:5])
if 'rec_text' in res[0]:
    print(res[0]['rec_text'][:5])
