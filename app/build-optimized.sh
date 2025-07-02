
#!/bin/bash

# Memory-optimized build script for weGROUP DeepAgent Platform
# Alternative solution for JavaScript heap out of memory issues

echo "🚀 Starting memory-optimized build process..."

# Set Node.js memory limit to 8GB
export NODE_OPTIONS="--max-old-space-size=8192 --max-semi-space-size=1024"

# Clear any existing build artifacts
echo "🧹 Cleaning previous build artifacts..."
rm -rf .next
rm -rf node_modules/.cache
rm -rf .vercel

# Clear Node.js cache
echo "🗑️ Clearing Node.js cache..."
npm cache clean --force 2>/dev/null || true

# Clear Next.js cache
echo "🗑️ Clearing Next.js cache..."
npx next clean 2>/dev/null || true

# Garbage collection before build
echo "🗑️ Running garbage collection..."
node -e "if (global.gc) { global.gc(); } else { console.log('Garbage collection not available'); }"

# Progressive build approach
echo "📦 Starting progressive build..."

# Step 1: Type checking with increased memory
echo "✅ Step 1: Type checking..."
NODE_OPTIONS="--max-old-space-size=4096" npx tsc --noEmit --incremental

if [ $? -ne 0 ]; then
    echo "❌ TypeScript compilation failed"
    exit 1
fi

# Step 2: Build with maximum memory
echo "🔨 Step 2: Building application..."
NODE_OPTIONS="--max-old-space-size=8192 --max-semi-space-size=1024 --optimize-for-size" npx next build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo "📊 Build completed with optimized memory usage"
    
    # Display build info
    if [ -f ".next/build-manifest.json" ]; then
        echo "📈 Build manifest created successfully"
    fi
    
    echo "🎉 Memory-optimized build completed successfully!"
    exit 0
else
    echo "❌ Build failed with memory issues"
    echo "🔧 Attempting recovery build with reduced memory..."
    
    # Fallback: Try with reduced features
    NODE_OPTIONS="--max-old-space-size=6144 --optimize-for-size" npx next build
    
    if [ $? -eq 0 ]; then
        echo "✅ Recovery build successful!"
        exit 0
    else
        echo "❌ Recovery build also failed"
        echo "💡 Consider running: yarn add --dev @next/bundle-analyzer"
        echo "💡 Consider implementing more aggressive code splitting"
        exit 1
    fi
fi
