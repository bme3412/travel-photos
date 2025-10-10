# 📸 Travel Photos Scripts

This directory contains helper scripts for managing your travel photo collection.

## 🚀 Quick Start

### Adding New Photos (Interactive)

The easiest way to add new photos:

```bash
node scripts/add-photos.js
```

This interactive script will:
- ✅ Upload photos to S3
- ✅ Create or update album
- ✅ Add photo metadata
- ✅ Update destinations
- ✅ Automatically handle all JSON files

**What you need:**
1. Photos in a folder (JPG, JPEG, PNG, or HEIC)
2. Album info (name, year, country)
3. Location info (city, coordinates from Google Maps)
4. AWS credentials in `.env` file

---

## 📋 Other Available Scripts

### `convert-heic.js`
Converts HEIC images to JPG format.

```bash
node scripts/convert-heic.js
```

### `migrate-to-s3.js`
Bulk upload photos from `public/images/albums/` to S3.

```bash
node scripts/migrate-to-s3.js
```

### `update-photos.js`
Updates photo URLs from HEIC to JPG in `photos.json`.

```bash
node scripts/update-photos.js
```

---

## 🗺️ Manual Process (If You Prefer)

### 1. Prepare Photos

```bash
# Create album folder
mkdir -p public/images/albums/YourAlbumName

# Add your photos
cp ~/Downloads/vacation-photos/* public/images/albums/YourAlbumName/
```

### 2. Convert HEIC (if needed)

```bash
node scripts/convert-heic.js
```

### 3. Upload to S3

```bash
node scripts/migrate-to-s3.js
```

### 4. Update JSON Files

Edit the following files manually:

#### `src/data/albums.json`
```json
{
  "id": "bali",
  "name": "🇮🇩 Bali Bliss",
  "countryId": "ID",
  "year": "2024"
}
```

#### `src/data/photos.json`
```json
{
  "id": "bali1",
  "albumId": "bali",
  "url": "https://d1mnon53ja4k10.cloudfront.net/albums/Bali/photo.jpg",
  "caption": "Rice Terraces at Sunset",
  "locationId": "Ubud",
  "coordinates": {
    "lng": 115.2889,
    "lat": -8.5069
  },
  "dateCreated": "2024-08-15",
  "tags": ["landscape", "sunset", "agriculture"]
}
```

#### `src/data/destinations.json`
```json
{
  "id": "25",
  "name": "Ubud",
  "country": "Indonesia",
  "description": "Explored rice terraces and traditional crafts",
  "latitude": -8.5069,
  "longitude": 115.2889
}
```

---

## 🌍 Getting Coordinates

1. Go to [Google Maps](https://maps.google.com)
2. Right-click on the location
3. Click the coordinates (top of menu) to copy
4. Format: `latitude, longitude` (e.g., `35.6762, 139.6503`)

---

## 🏴 Country Codes Reference

Common country codes:
- 🇺🇸 US - United States
- 🇫🇷 FR - France
- 🇯🇵 JP - Japan
- 🇮🇹 IT - Italy
- 🇪🇸 ES - Spain
- 🇬🇧 GB - United Kingdom
- 🇩🇪 DE - Germany
- 🇹🇭 TH - Thailand
- 🇦🇺 AU - Australia
- 🇧🇷 BR - Brazil
- 🇲🇽 MX - Mexico
- 🇨🇦 CA - Canada

[Full list of ISO 3166-1 alpha-2 codes](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2)

---

## ⚙️ Environment Variables

Required in `.env` file:

```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_BUCKET_NAME=your-bucket-name
CLOUDFRONT_DOMAIN=your-cloudfront-domain.cloudfront.net
```

---

## 🐛 Troubleshooting

### "Missing AWS credentials"
Make sure your `.env` file has all required AWS variables.

### "Photo not appearing on website"
1. Check the URL is accessible in browser
2. Verify `albumId` matches an existing album
3. Check coordinates are in correct format (lng, lat)
4. Clear browser cache and restart dev server

### "HEIC files not converting"
Install Sharp with HEIC support:
```bash
npm install sharp
```

### "S3 upload fails"
1. Verify AWS credentials
2. Check bucket permissions
3. Ensure bucket exists and is accessible

---

## 💡 Pro Tips

1. **Batch Processing**: Place all photos for a location in one folder for easier processing
2. **EXIF Dates**: The script auto-extracts dates from photo metadata
3. **Image Optimization**: Photos are automatically resized and optimized during upload
4. **Backups**: All JSON files are backed up before changes (`.backup` extension)
5. **CloudFront**: Use CloudFront URLs for faster loading (configure in `.env`)

---

## 🚦 Workflow Example

```bash
# 1. Add photos to folder
mkdir -p public/images/albums/Iceland2024
cp ~/Photos/Iceland/* public/images/albums/Iceland2024/

# 2. Run interactive script
node scripts/add-photos.js

# 3. Follow prompts:
#    - Album name: Iceland
#    - Year: 2024
#    - Country: Iceland
#    - Location: Reykjavik
#    - Coordinates: 64.1466, -21.9426
#    - Add captions for each photo

# 4. Test locally
npm run dev

# 5. Deploy
git add .
git commit -m "Add Iceland 2024 photos"
git push
```

---

## 📝 Notes

- Photos are automatically rotated based on EXIF orientation
- Images larger than 1920px are resized for performance
- JPEG quality is set to 85% for optimal size/quality balance
- JSON files maintain alphabetical/chronological order for readability

---

Need help? Open an issue or check the main README.md

