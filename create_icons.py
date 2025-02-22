from PIL import Image, ImageDraw, ImageFont
import os

def create_icon(size, text):
    # Create a new image with a light blue background
    image = Image.new('RGB', (size, size), color='lightblue')
    draw = ImageDraw.Draw(image)
    
    # Try to use a default font
    try:
        font = ImageFont.truetype("/Library/Fonts/Arial.ttf", size // 6)
    except IOError:
        font = ImageFont.load_default()
    
    # Get text size
    text_width, text_height = draw.textsize(text, font=font)
    
    # Calculate position to center the text
    position = ((size - text_width) / 2, (size - text_height) / 2)
    
    # Draw the text
    draw.text(position, text, fill='navy', font=font)
    
    return image

# Ensure icons directory exists
icons_dir = '/Users/academicdirector/Desktop/WCTECM/wctapp/public/icons'
os.makedirs(icons_dir, exist_ok=True)

# Create icons
icon_192 = create_icon(192, 'WCT QB')
icon_512 = create_icon(512, 'WCT QB')

# Save icons
icon_192.save(os.path.join(icons_dir, 'icon-192x192.png'))
icon_512.save(os.path.join(icons_dir, 'icon-512x512.png'))

print("Icons created successfully!")
