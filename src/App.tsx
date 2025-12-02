// App.tsx — Ionic React + TypeScript minimal
import {
  IonApp,
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonGrid,
  IonRow,
  IonCol,
} from "@ionic/react";
import React, { useEffect, useState } from "react";
import { Geolocation } from "@capacitor/geolocation";
import { App as CapacitorApp } from "@capacitor/app";

const STORAGE_KEY = "savedPos";

type Pos = { lat: number; lng: number } | null;

const App: React.FC = () => {
  const [savedPos, setSavedPos] = useState<Pos>(null);

  useEffect(() => {
    // Chiede permessi appena l'app si avvia
    (async () => {
      try {
        const status = await Geolocation.requestPermissions();

        console.log("Permessi location:", status);
      } catch (e) {
        console.error("Errore richiesta permessi", e);
      }
    })();
  }, []);

  useEffect(() => {
    const s = localStorage.getItem(STORAGE_KEY);
    if (s) setSavedPos(JSON.parse(s));
    console.log(savedPos);

    // listen for deep links / shortcuts
    const handler = CapacitorApp.addListener("appUrlOpen", (data: any) => {
      try {
        const url = new URL(data.url);
        const action = url.searchParams.get("action");
        if (action === "save") doSave();
        if (action === "go") doGo();
      } catch (e) {
        console.log(e);
      }
    });

    return () => {
      handler.then((h) => h.remove());
    };
  }, []);

  useEffect(() => {
    const handler = CapacitorApp.addListener("backButton", () => {
      // chiude l'app se premuto il tasto fisico
      CapacitorApp.exitApp();
    });

    return () => {
      handler.then((h) => h.remove());
    };
  }, []);

  const doSave = async () => {
    const pos = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 8000, // facoltativo
      maximumAge: 0, // evita cache
    });
    const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
    setSavedPos(p);
    // minimal feedback
    alert("Posizione salvata");
  };

  const doGo = async () => {
    const s = localStorage.getItem(STORAGE_KEY);
    if (!s) return alert("Nessuna posizione salvata");
    const p = JSON.parse(s);
    // Open native maps via geo: URI (Android) or maps.apple.com (iOS)
    // We'll attempt both via App openUrl handled natively in capacitor
    const geo = `geo:${p.lat},${p.lng}?q=${p.lat},${p.lng}`;
    const apple = `https://maps.apple.com/?daddr=${p.lat},${p.lng}&dirflg=d`;
    // try to open geo: first (Android), fallback to apple maps url
    try {
      // dynamic import to keep bundles small
      const { AppLauncher } = await import("@capacitor/app-launcher");
      await AppLauncher.openUrl({ url: geo });
    } catch (e) {
      const { AppLauncher } = await import("@capacitor/app-launcher");
      await AppLauncher.openUrl({ url: apple });
      console.log(e);
    }
  };

  return (
    <IonApp>
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Dov'è la mia macchina</IonTitle>
          </IonToolbar>
        </IonHeader>

        <IonContent>
          <IonGrid className="full-grid">
            <IonRow className="half-row">
              <IonCol className="half-col">
                <IonButton expand="block" className="full-btn save" onClick={doSave}>
                  Ciao Nino, cliccami per ricordare dove hai parcheggiato!
                </IonButton>
              </IonCol>
            </IonRow>

            <IonRow className="half-row">
              <IonCol className="half-col">
                <IonButton expand="block" className="full-btn go" onClick={doGo}>
                  Ciao Nino, cliccami per sapere dove hai parcheggiato l'ultima
                  volta.
                </IonButton>
              </IonCol>
            </IonRow>
          </IonGrid>
        </IonContent>
      </IonPage>
    </IonApp>
  );
};

export default App;
