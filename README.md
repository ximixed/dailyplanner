# Daily Planner

Tracks daily tasks, school activities and notes. Built with HTML, CSS, JavaScript and React (Vite).

## Run it
    npm install
    npm run dev

Open the local address Vite prints (usually http://localhost:5173).

## Build for hosting
    npm run build     # output in /dist

## Adding a back end later
Data is stored in the browser through `src/utils/useLocalStorage.js`.
Replace that hook with calls to your API (fetch/axios) and keep the same
`[value, setValue]` shape, so the components don't need to change.
