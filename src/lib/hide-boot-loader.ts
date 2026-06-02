/** Remove index.html boot overlay after React mounts. */
export function hideBootLoader() {
  document.getElementById("hub-boot-loader")?.remove();
}
