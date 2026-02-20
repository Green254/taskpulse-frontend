# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## API Configuration

1. Create a local env file from the example:
   - PowerShell: `Copy-Item .env.example .env`
2. Optional backend URL override:
   - `VITE_API_BASE_URL=http://127.0.0.1:8000`
   - If empty, frontend will call `http(s)://<current-host>:8000`.
3. Ensure backend CORS allows your frontend origin (for example `http://localhost:4173`).
4. If testing from another device on LAN:
   - Run backend on `0.0.0.0` (not `127.0.0.1`)
   - Open frontend via the backend machine IP/host
