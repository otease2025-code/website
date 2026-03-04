# Mellow Color Scheme Update Guide

This document provides the mapping from old colors to the new Mellow color scheme.

## New Color Palette

- **Primary Purple**: `#6328FF` - Main brand color
- **Secondary Purple**: `#9E98ED` - Light purple accent
- **Cyan**: `#EAFCFF` - Light background accent
- **Orange**: `#FE5C2B` - Alert/action color  
- **Lime**: `#C2D738` - Success/positive color
- **Pink**: `#FE97CF` - Fun accent color

## Typography

- **Primary Font**: Poppins (body text, paragraphs, labels)
- **Display Font**: Oxanium (headings, titles)

## Gradient Replacements

### Patient Interface
```
OLD → NEW
from-purple-400 to-purple-500 → from-[#6328FF] to-[#9E98ED]
from-pink-400 to-pink-500 → from-[#FE97CF] to-[#FE5C2B]
from-blue-400 to-cyan-500 → from-[#6328FF] to-[#EAFCFF]
from-green-400 to-emerald-500 → from-[#C2D738] to-[#EAFCFF]
from-yellow-400 to-orange-400 → from-[#C2D738] to-[#9E98ED]
from-red-400 to-pink-400 → from-[#FE97CF] to-[#6328FF]
from-indigo-400 to-purple-500 → from-[#9E98ED] to-[#FE97CF]
```

### Therapist Interface
```
OLD → NEW
from-blue-500 to-blue-600 → from-[#6328FF] to-[#9E98ED]
from-purple-500 to-purple-600 → from-[#9E98ED] to-[#FE97CF]
from-green-500 to-green-600 → from-[#C2D738] to-[#EAFCFF]
from-pink-500 to-pink-600 → from-[#FE97CF] to-[#FE5C2B]
from-orange-500 to-orange-600 → from-[#FE5C2B] to-[#C2D738]
```

## Background Replacements
```
bg-purple-50 → bg-[#EAFCFF]
bg-pink-50 → bg-[#FE97CF]/10
bg-blue-50 → bg-[#9E98ED]/20
bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50 → 
  bg-gradient-to-br from-[#EAFCFF] via-[#9E98ED]/20 to-[#FE97CF]/10
```

## Text Colors
```
text-purple-600 → text-[#6328FF]
text-pink-600 → text-[#FE97CF]
text-blue-600 → text-[#6328FF]
text-gray-800 → text-[#2b2b2b]
text-gray-600 → text-[#2b2b2b]/70
text-gray-500 → text-[#2b2b2b]/60
```

## Border Colors
```
border-purple-200 → border-[#6328FF]/20
border-pink-200 → border-[#FE97CF]/30
border-green-300 → border-[#C2D738]/50
```

## Special Styling

### Headers (All screens)
```tsx
<div className="bg-gradient-to-r from-[#6328FF] to-[#9E98ED] text-white p-6 rounded-b-[3rem] shadow-lg">
  <h1 style={{ fontFamily: 'Oxanium, sans-serif' }} className="text-2xl font-bold">
    Title
  </h1>
</div>
```

### Cards
```tsx
<div className="bg-white rounded-2xl p-5 shadow-md border-2 border-[#6328FF]/20">
```

### Buttons
```tsx
<Button className="bg-gradient-to-r from-[#6328FF] to-[#9E98ED] hover:from-[#5520E6] hover:to-[#8A84D4]">
```
