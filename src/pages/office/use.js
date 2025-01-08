import { computed, ref, watch } from "vue";

export const useOnlinePreview = (key, value) => {
  const token = ref(localStorage.getItem(key) || value);
  const fileUrl = computed(() => {
    const url = atob(decodeURIComponent(token.value));
    const utf8 = Uint8Array.from(url, (m) => m.codePointAt(0));
    const fileUrl = new TextDecoder().decode(utf8);
    const u = new URL(fileUrl);
    u.host = window.location.host;
    return u.href;
  });
  watch(fileUrl, () => {
    if (fileUrl.value) {
      console.log("change --- ", token.value);
      localStorage.setItem(key, token.value);
    }
  });
  const base64 = computed(() => {
    const base64 = Array.from(new TextEncoder().encode(fileUrl.value), (byte) =>
      String.fromCodePoint(byte)
    ).join("");
    return btoa(base64);
  });
  const iframeUrl = computed(() => {
    return `/kk/onlinePreview?url=${base64.value}`;
  });
  return { token, fileUrl, base64, iframeUrl };
};
