/** Remove index.html boot overlay after React mounts. */
export function hideBootLoader() {
  if (typeof window !== "undefined") {
    window.__hubBootReady = true;
    window.dispatchEvent(new Event("hub-boot-ready"));
  }
  document.getElementById("hub-boot-loader")?.remove();
}
