#  Sughar (سگھڑ) — AI-Powered Smart Home Services & Recycling Platform

**Sughar** ("Ab ghar hoga asaan") is an end-to-end mobile web application tailored for Pakistani households to streamline daily domestic management and promote eco-friendly urban waste recycling.

---

##  Live Links
-  **Live Deployed App:** https://home-management-recy-pwal.bolt.host
-  **Google Stitch UI Prototype:** https://stitch.withgoogle.com/preview/13472886667223320709?node-id=a68bee7a25f2473bbebb10f955e962a9

---

##  Problem Statement & Target Audience
In modern urban households across Pakistan, managing domestic help (maids) and safely disposing of household clutter/kabaar are major challenges:
- Finding vetted, trustworthy home help requires safe verification.
- Disposing of recyclable clutter (old clothes, electronics, books) lacks organized doorstep pickup and fair valuation.

**Sughar** solves both challenges through a single, intuitive digital platform.

---

##  Key Features
1. **Verified Maid Booking:** Schedule professional home cleaning and domestic assistance with verified credentials.
2. **Doorstep Clutter Pickup:** Select waste categories (Old Clothes, Books/Papers, Furniture, E-Waste, Kitchen Cutlery) and pick a convenient delivery slot.
3. **AI Recycling Value & Eco Estimator:** An intelligent AI assistant powered by Google Gemini API that evaluates selected clutter, calculates estimated resale/recycling value in PKR, and provides eco-impact scores.
4. **Interactive Booking Dashboard:** Track scheduled pickups and domestic service slots in real time.

---

##  AI Feature & System Prompt
The app integrates the **Google Gemini API** (`gemini-1.5-flash`) to act as a smart **Urban Waste & Household Assistant**.

### System Prompt Used:
> *"You are 'Sughar AI', an expert domestic management and waste recycling advisor for Pakistani households. When given a list of selected household clutter items (e.g., electronic waste, old papers, clothes), analyze the estimated volume, provide a realistic resale/salvage estimate in PKR, calculate carbon offset impact, and recommend whether to recycle or donate."*

---

##  Tech Stack & Services
- **UI Design & Prototyping:** Google Stitch
- **Frontend Framework:** React.js / Vite / Tailwind CSS
- **Deployment & Hosting:** Bolt.new
- **AI Integration:** Google Gemini API

---

##  Local Setup & Installation
```bash
# 1. Clone the repository
git clone [https://github.com/RabiaKhawaja/Sughar-App.git](https://github.com/RabiaKhawaja/Sughar-App.git)

# 2. Navigate to directory
cd Sughar-App

# 3. Install dependencies
npm install

# 4. Configure environment variable (.env)
VITE_GEMINI_API_KEY=your_gemini_api_key_here

# 5. Start dev server
npm run dev
