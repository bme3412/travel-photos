# 📸 Quick Guide: Adding Photos

## ⚡ Super Fast Method

```bash
npm run add-photos
```

Follow the interactive prompts. That's it! 🎉

---

## 📋 What You'll Need

### Before You Start:
1. ✅ Photos in a folder (JPG, PNG, or HEIC format)
2. ✅ Album info ready (name, year, country)
3. ✅ Location coordinates from Google Maps

### Getting Coordinates (30 seconds):
1. Open [Google Maps](https://maps.google.com)
2. Right-click on your location
3. Click the coordinates at the top to copy
4. Format: `35.6762, 139.6503` (latitude, longitude)

---

## 🚀 Step-by-Step Walkthrough

### 1. Organize Your Photos
```bash
mkdir -p public/images/albums/Iceland2024
cp ~/Downloads/iceland-trip/* public/images/albums/Iceland2024/
```

### 2. Run the Script
```bash
npm run add-photos
```

### 3. Answer the Prompts

**Q: Enter the folder path with your photos:**  
`public/images/albums/Iceland2024`

**Q: Use existing album? (y/n):**  
`n` (for new album) or `y` (to add to existing)

**Q: Album name:**  
`Iceland Adventures`

**Q: Year:**  
`2024`

**Q: Country:**  
`Iceland`

**Q: Country code:**  
`IS` (auto-suggested for most countries)

**Q: Location/City name:**  
`Reykjavik`

**Q: Coordinates:**  
`64.1466, -21.9426` (paste from Google Maps)

**For each photo:**
- Caption: `Northern Lights over the city`
- Tags: `nature, aurora, night, winter`

### 4. Done! ✨
```bash
npm run dev  # Test it
```

---

## 🌍 Common Country Codes

| Country | Code | Country | Code |
|---------|------|---------|------|
| 🇺🇸 USA | US | 🇯🇵 Japan | JP |
| 🇫🇷 France | FR | 🇮🇹 Italy | IT |
| 🇪🇸 Spain | ES | 🇬🇧 UK | GB |
| 🇩🇪 Germany | DE | 🇹🇭 Thailand | TH |
| 🇦🇺 Australia | AU | 🇧🇷 Brazil | BR |
| 🇲🇽 Mexico | MX | 🇨🇦 Canada | CA |

---

## 💡 Pro Tips

- **Batch Upload**: Put all photos from one location in the same folder
- **HEIC Photos**: Automatically converted to JPG during upload
- **Photo Dates**: Extracted from EXIF data automatically
- **Large Photos**: Auto-resized to 1920px for optimal performance
- **Backups**: All JSON files are backed up before changes

---

## 🐛 Troubleshooting

**"Directory not found"**  
→ Use the full path: `public/images/albums/YourFolder`

**"Missing AWS credentials"**  
→ Check your `.env` file has all AWS variables

**"Invalid coordinates"**  
→ Format must be: `latitude, longitude` (comma-separated)

**Photos not showing up?**  
→ Restart dev server: `Ctrl+C` then `npm run dev`

---

## 🎯 Alternative: Manual Method

If you prefer to edit JSON files directly, see `scripts/README.md`

---

## ✅ Checklist

- [ ] Photos in folder
- [ ] Coordinates from Google Maps
- [ ] AWS credentials in `.env`
- [ ] Run `npm run add-photos`
- [ ] Follow prompts
- [ ] Test with `npm run dev`
- [ ] Deploy with `git push`

---

**Need more details?** Check `scripts/README.md`

