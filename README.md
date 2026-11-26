# Home Shape — Next.js + MongoDB

The project is split for independent deployment:

- `frontend/` is the React/Next.js storefront for Vercel. The existing storefront, furniture catalog, product detail, content pages, admin theme, styles, scripts, and images are preserved under `frontend/public/legacy/` and `frontend/public/img/`; the Next.js App Router renders each page through a React compatibility component so the current theme and its interactions remain intact.
- `backend/` is the Express/Mongoose JSON API for Render. It manages admin authentication, products, editable site content, and contact/newsletter enquiries.

## Run locally

1. Use Node.js 20 or newer. Install and start MongoDB locally, or use a MongoDB Atlas database.
2. In `backend/`, copy `.env.example` to `.env`. Set `MONGODB_URI`, `JWT_SECRET` (at least 32 characters), `ADMIN_EMAIL`, `ADMIN_PASSWORD` (at least 12 characters), and `FRONTEND_ORIGIN=http://localhost:3000`. To enable admin image uploads, also set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET`.
3. In `frontend/`, copy `.env.example` to `.env.local`; the local API address is `http://localhost:3001`.
4. In separate terminals:

   ```powershell
   Set-Location backend
   npm install
   npm start
   ```

   ```powershell
   Set-Location frontend
   npm install
   npm run dev
   ```

5. Open `http://localhost:3000`. The admin login is at `http://localhost:3000/admin`. The first admin account is created from `ADMIN_EMAIL` and `ADMIN_PASSWORD` when the API connects to MongoDB.

The source HTML files are kept in `frontend/public/legacy/` so no original theme pages or interactions are discarded. Next.js routes map the old `.html` links to React routes.

## Deploy

### Vercel frontend

Import the repository into Vercel and set **Root Directory** to `frontend`. Add this environment variable:

```text
NEXT_PUBLIC_API_BASE_URL=https://YOUR-RENDER-SERVICE.onrender.com
```

### Render backend

Create a Web Service from the repository using **Root Directory** `backend`; `render.yaml` includes the Node start/build commands and health check. Set these environment variables in Render:

- `MONGODB_URI`: your MongoDB Atlas connection string. Replace the username/password/database placeholders and URL-encode special characters in credentials.
- `JWT_SECRET`: a private random value of at least 32 characters.
- `ADMIN_EMAIL` and `ADMIN_PASSWORD`: the initial administrator login.
- `FRONTEND_ORIGIN`: the exact Vercel production origin, for example `https://your-store.vercel.app` (no trailing slash). Add comma-separated origins only when you intentionally use more than one.
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET`: Cloudinary account values used to sign authenticated admin uploads. Keep the API secret in Render/backend environment variables only; never use a `NEXT_PUBLIC_*` variable for it.
- `NODE_ENV=production`

Set the same Render service URL in Vercel as `NEXT_PUBLIC_API_BASE_URL`, then redeploy the frontend. Never commit `.env` files or put MongoDB credentials in `NEXT_PUBLIC_*` variables. GitHub Pages cannot host the Next.js server or the backend API.

## Tests

Run backend tests from `backend/`:

```powershell
npm test
```
# fur2node
