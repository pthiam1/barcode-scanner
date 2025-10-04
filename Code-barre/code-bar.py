import barcode
from barcode.writer import ImageWriter

# Exemple avec Code128 
code = barcode.get('code128', '123456789', writer=ImageWriter())
filename = code.save("Code-barre")
print("Code barre généré:", filename)
