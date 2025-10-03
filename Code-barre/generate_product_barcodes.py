#!/usr/bin/env python3
"""
Générateur de codes-barres pour les produits de l'application AfricaMarket
"""

import barcode
from barcode.writer import ImageWriter
import os
import json
import requests
from PIL import Image, ImageDraw, ImageFont

def generate_barcode_with_text(product_data, output_dir="barcodes"):
    """
    Génère un code-barres avec le nom du produit et le prix
    """
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    # Générer le code-barres
    barcode_code = product_data.get('barcode', '1234567890123')
    product_name = product_data.get('name', 'Produit')
    price = product_data.get('price', 0)
    
    # Créer le code-barres
    code = barcode.get('ean13', barcode_code, writer=ImageWriter())
    
    # Options pour l'image
    options = {
        'module_width': 0.4,
        'module_height': 15.0,
        'quiet_zone': 6.0,
        'font_size': 14,
        'text_distance': 5.0,
        'dpi': 300
    }
    
    # Sauvegarder le code-barres de base
    barcode_filename = f"{output_dir}/barcode_{barcode_code}"
    code.save(barcode_filename, options=options)
    
    # Ouvrir l'image générée et ajouter des informations
    img = Image.open(f"{barcode_filename}.png")
    
    # Créer une nouvelle image avec plus d'espace pour le texte
    width, height = img.size
    new_height = height + 80
    new_img = Image.new('RGB', (width, new_height), 'white')
    
    # Coller le code-barres au centre
    new_img.paste(img, (0, 0))
    
    # Ajouter le texte
    draw = ImageDraw.Draw(new_img)
    
    try:
        # Essayer d'utiliser une police par défaut
        font_large = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 16)
        font_small = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 14)
    except:
        # Fallback vers la police par défaut
        font_large = ImageFont.load_default()
        font_small = ImageFont.load_default()
    
    # Centrer le nom du produit
    text_width = draw.textlength(product_name, font=font_large)
    x_pos = (width - text_width) // 2
    draw.text((x_pos, height + 10), product_name, fill='black', font=font_large)
    
    # Centrer le prix
    price_text = f"{price/100:.2f} FCFA"
    price_width = draw.textlength(price_text, font=font_small)
    x_pos = (width - price_width) // 2
    draw.text((x_pos, height + 35), price_text, fill='green', font=font_small)
    
    # Sauvegarder la nouvelle image
    final_filename = f"{output_dir}/product_{barcode_code}.png"
    new_img.save(final_filename)
    
    print(f"✅ Code-barres généré: {final_filename}")
    return final_filename

def fetch_products_from_api(api_url="http://localhost:8000"):
    """
    Récupère les produits depuis l'API
    """
    try:
        response = requests.get(f"{api_url}/items/")
        if response.status_code == 200:
            return response.json()
        else:
            print(f"❌ Erreur API: {response.status_code}")
            return []
    except requests.exceptions.ConnectionError:
        print("❌ Impossible de se connecter à l'API. Utilisation des données de test.")
        return []

def main():
    """
    Fonction principale
    """
    print("🏷️  Générateur de codes-barres AfricaMarket")
    print("=" * 50)
    
    # Essayer de récupérer les produits de l'API
    products = fetch_products_from_api()
    
    # Si pas de produits de l'API, utiliser des données de test
    if not products:
        print("📝 Utilisation des produits de test...")
        products = [
            {
                "name": "Banane Bio",
                "price": 150,
                "barcode": "1234567890123"
            },
            {
                "name": "Pomme Rouge",
                "price": 200,
                "barcode": "2345678901234"
            },
            {
                "name": "Orange Douce",
                "price": 180,
                "barcode": "3456789012345"
            },
            {
                "name": "Mangue Fraîche",
                "price": 300,
                "barcode": "4567890123456"
            },
            {
                "name": "Ananas Tropical",
                "price": 500,
                "barcode": "5678901234567"
            }
        ]
    
    print(f"📦 {len(products)} produits trouvés")
    print()
    
    # Générer les codes-barres
    generated_files = []
    for product in products:
        try:
            filename = generate_barcode_with_text(product)
            generated_files.append(filename)
        except Exception as e:
            print(f"❌ Erreur pour {product.get('name', 'Produit')}: {e}")
    
    print()
    print(f"✅ {len(generated_files)} codes-barres générés avec succès!")
    print("📁 Fichiers générés dans le dossier 'barcodes/'")

if __name__ == "__main__":
    main()