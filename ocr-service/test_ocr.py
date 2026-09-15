import cv2
from paddleocr import PaddleOCR
ocr = PaddleOCR(use_angle_cls=True, lang='en', enable_mkldnn=False)
image = cv2.imread(r"C:\Users\royar\.gemini\antigravity-ide\brain\8f23b65b-9f6c-4434-a68a-a34c3bb4a81b\.user_uploaded\media_1789451338803.png")
res = ocr.ocr(image)
print(type(res))
if isinstance(res, list):
    print("Len:", len(res))
    if len(res) > 0:
        print(type(res[0]))
        print(res[0])
else:
    for item in res:
        print(item)
