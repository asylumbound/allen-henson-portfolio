#!/bin/bash
# Generate responsive image sizes for srcset (400w, 800w, 1200w)
# Requires: cwebp (for webp), ImageMagick (for resizing)

set -e

# Directories to process
PRODUCT_DIR="/home/ubuntu/allen-henson-portfolio/client/public/images/product"
SALES_DIR="/home/ubuntu/allen-henson-portfolio/client/public/images/sales"

# Target widths
WIDTHS=(400 800 1200)

generate_sizes() {
    local dir=$1
    local file=$2
    local basename=$(basename "$file" .webp)
    local dirname=$(dirname "$file")
    
    # Skip if already a sized variant
    if [[ "$basename" =~ -[0-9]+$ ]]; then
        return
    fi
    
    echo "Processing: $file"
    
    for width in "${WIDTHS[@]}"; do
        local output="${dirname}/${basename}-${width}.webp"
        
        # Skip if already exists
        if [ -f "$output" ]; then
            echo "  Skipping ${width}w (exists)"
            continue
        fi
        
        # Get original dimensions
        local orig_width=$(identify -format "%w" "$file" 2>/dev/null || echo "0")
        
        # Only resize if original is larger than target
        if [ "$orig_width" -gt "$width" ]; then
            echo "  Creating ${width}w variant..."
            convert "$file" -resize "${width}x>" -quality 85 "$output" 2>/dev/null || {
                # Fallback: use cwebp if convert fails
                echo "  Using cwebp fallback for ${width}w..."
                # First decode webp to png, then resize and re-encode
                dwebp "$file" -o "/tmp/temp_${basename}.png" 2>/dev/null && \
                convert "/tmp/temp_${basename}.png" -resize "${width}x>" "/tmp/temp_${basename}_${width}.png" 2>/dev/null && \
                cwebp -q 85 "/tmp/temp_${basename}_${width}.png" -o "$output" 2>/dev/null
                rm -f "/tmp/temp_${basename}.png" "/tmp/temp_${basename}_${width}.png"
            }
        else
            echo "  Skipping ${width}w (original smaller)"
        fi
    done
}

# Process product images
echo "=== Processing Product Images ==="
if [ -d "$PRODUCT_DIR" ]; then
    for file in "$PRODUCT_DIR"/*.webp; do
        [ -f "$file" ] && generate_sizes "$PRODUCT_DIR" "$file"
    done
fi

# Process sales images
echo "=== Processing Sales Images ==="
if [ -d "$SALES_DIR" ]; then
    for file in "$SALES_DIR"/*.webp; do
        [ -f "$file" ] && generate_sizes "$SALES_DIR" "$file"
    done
fi

echo "=== Done ==="
echo "Responsive images generated successfully!"
