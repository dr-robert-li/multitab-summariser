#!/usr/bin/env python3
"""
Create proper PNG icons for the Multi-Tab Summarizer extension
Uses PIL/Pillow if available, fallback to simple method
"""

try:
    from PIL import Image, ImageDraw
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False
    print("PIL not available, will create basic icons")

import os

def create_icon_with_pil(size):
    """Create a proper icon using PIL"""
    # Create image with transparent background
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Draw gradient background (approximate)
    # Since PIL doesn't have easy gradients, we'll use solid color
    purple = (118, 75, 162, 255)  # #764ba2
    
    # Draw rounded rectangle background
    margin = max(1, size // 8)
    draw.rounded_rectangle(
        [margin, margin, size - margin, size - margin],
        radius=max(1, size // 6),
        fill=purple
    )
    
    # Draw document icon in white
    white = (255, 255, 255, 255)
    doc_margin = max(2, size // 4)
    doc_width = size - (doc_margin * 2)
    doc_height = size - (doc_margin * 2)
    
    # Document background
    draw.rectangle(
        [doc_margin, doc_margin, size - doc_margin, size - doc_margin],
        fill=white
    )
    
    # Draw lines to represent text (if icon is large enough)
    if size >= 32:
        line_color = purple
        line_margin = doc_margin + max(1, size // 16)
        line_width = max(1, size // 32)
        
        # Draw 3-4 horizontal lines
        num_lines = min(4, size // 8)
        line_spacing = max(2, (doc_height - line_margin * 2) // (num_lines + 1))
        
        for i in range(num_lines):
            y = doc_margin + line_margin + (i + 1) * line_spacing
            line_end = size - doc_margin - line_margin
            if i == num_lines - 1:  # Last line shorter
                line_end -= max(1, doc_width // 4)
            
            draw.rectangle(
                [doc_margin + line_margin, y, line_end, y + line_width],
                fill=line_color
            )
    
    return img

def create_simple_png(size):
    """Create a very basic PNG file"""
    # This creates a minimal valid PNG
    import struct
    import zlib
    
    # PNG signature
    png_signature = b'\x89PNG\r\n\x1a\n'
    
    # Create RGBA data (purple background)
    rgba_data = []
    purple = [118, 75, 162, 255]  # RGBA
    
    for y in range(size):
        row = []
        for x in range(size):
            # Simple pattern: purple background with white center
            if (size//4 <= x < 3*size//4) and (size//4 <= y < 3*size//4):
                row.extend([255, 255, 255, 255])  # White center
            else:
                row.extend(purple)  # Purple border
        rgba_data.extend(row)
    
    # Add filter bytes (0 for each row)
    filtered_data = b''
    for y in range(size):
        filtered_data += b'\x00'  # No filter
        start = y * size * 4
        end = start + size * 4
        filtered_data += bytes(rgba_data[start:end])
    
    # Compress the data
    compressed_data = zlib.compress(filtered_data)
    
    # Create chunks
    def make_chunk(chunk_type, data):
        length = struct.pack('>I', len(data))
        crc = zlib.crc32(chunk_type + data) & 0xffffffff
        return length + chunk_type + data + struct.pack('>I', crc)
    
    # IHDR chunk
    ihdr_data = struct.pack('>IIBBBBB', size, size, 8, 6, 0, 0, 0)
    ihdr_chunk = make_chunk(b'IHDR', ihdr_data)
    
    # IDAT chunk
    idat_chunk = make_chunk(b'IDAT', compressed_data)
    
    # IEND chunk
    iend_chunk = make_chunk(b'IEND', b'')
    
    return png_signature + ihdr_chunk + idat_chunk + iend_chunk

def main():
    sizes = [16, 48, 128]
    
    for size in sizes:
        filename = f'icons/icon{size}.png'
        
        if PIL_AVAILABLE:
            try:
                img = create_icon_with_pil(size)
                img.save(filename, 'PNG')
                print(f"Created high-quality {filename} using PIL")
                continue
            except Exception as e:
                print(f"PIL failed for {size}x{size}: {e}")
        
        # Fallback to simple PNG creation
        try:
            png_data = create_simple_png(size)
            with open(filename, 'wb') as f:
                f.write(png_data)
            print(f"Created basic {filename}")
        except Exception as e:
            print(f"Failed to create {filename}: {e}")

if __name__ == "__main__":
    main()