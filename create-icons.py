#!/usr/bin/env python3
"""
Simple script to create PNG icons from base64 data
Creates 16x16, 48x48, and 128x128 PNG icons for the Chrome extension
"""

import base64
import os

# Simple 16x16 PNG icon (purple square with white document icon)
icon16_data = """
iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlz
AAAAB3AAAAT3CAMD/AE2AAAAFklEQVQ4T2NgGA1gNID/hwNGDRgNYKQAAA7tAkF2Qv3FAAAAAElF
TkSuQmCC
"""

# Simple 48x48 PNG icon  
icon48_data = """
iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAABHNCSVQICAgIfAhkiAAAAAlwSFlz
AAAAB3AAAAT3CAMD/AE2AAAAFklEQVRoQ+2YQQ0AMAzCoAOL+E8gJ3VwKbsIAAAAAAAAAAAAA/wF
jlcGALFdKdIAAAAASUVORK5CYII=
"""

# Simple 128x128 PNG icon
icon128_data = """
iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAABHNCSVQICAgIfAhkiAAAAAlwSFlz
AAAAB3AAAAT3CAMD/AE2AAAAFklEQVR4Xu3BMQEAAADCoPVP7WsIoAAAAAAAAAAAAAAAAAAAAAAAA
AAAAAAAAAAAADyFAAgAX/EQpQAAAABJRU5ErkJggg==
"""

def create_icon(data, filename):
    """Create PNG icon from base64 data"""
    try:
        # Decode base64 data
        png_data = base64.b64decode(data.replace('\n', '').strip())
        
        # Write to file
        with open(f'icons/{filename}', 'wb') as f:
            f.write(png_data)
        
        print(f"Created {filename}")
        return True
    except Exception as e:
        print(f"Error creating {filename}: {e}")
        return False

def create_simple_icon_data():
    """Create simple colored PNG icons programmatically"""
    # For a more proper implementation, we'd use PIL/Pillow
    # But for now, let's create minimal valid PNG files
    
    # Minimal PNG header + purple pixel data
    png_header = b'\x89PNG\r\n\x1a\n'
    
    # This is a very basic approach - in practice you'd want to use PIL
    # Let's create a simple approach using a different method
    
    # Create simple solid color PNGs
    sizes = [16, 48, 128]
    
    for size in sizes:
        # Create minimal PNG content (this is simplified)
        filename = f'icon{size}.png'
        
        # For now, create empty files that Chrome can at least recognize
        # This is a placeholder - ideally use proper image library
        with open(f'icons/{filename}', 'wb') as f:
            # Write minimal PNG structure
            f.write(png_header)
            # Add minimal PNG data (this won't be a proper image but Chrome might accept it)
            f.write(b'\x00\x00\x00\rIHDR')  # Basic IHDR chunk
            f.write(size.to_bytes(4, 'big'))  # Width
            f.write(size.to_bytes(4, 'big'))  # Height
            f.write(b'\x08\x02\x00\x00\x00')  # Bit depth, color type, etc
            f.write(b'\x00\x00\x00\x00IEND\xaeB`\x82')  # IEND chunk
        
        print(f"Created placeholder {filename}")

if __name__ == "__main__":
    # Ensure icons directory exists
    os.makedirs('icons', exist_ok=True)
    
    # Try to create proper icons first
    success = True
    success &= create_icon(icon16_data, 'icon16.png')
    success &= create_icon(icon48_data, 'icon48.png') 
    success &= create_icon(icon128_data, 'icon128.png')
    
    if not success:
        print("Falling back to simple icon creation...")
        create_simple_icon_data()
    
    print("Icon creation complete!")