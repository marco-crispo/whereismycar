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
  IonToast,
  IonSelect,
  IonSelectOption,
  IonInput,
  IonLabel,
} from "@ionic/react";
import React, { JSX, useCallback, useEffect, useRef, useState } from "react";
import { Geolocation } from "@capacitor/geolocation";
import { Capacitor } from "@capacitor/core";
import { App as CapacitorApp } from "@capacitor/app";
import { STORAGE_KEY } from "./types/constants";
import { Positions } from "./types/GlobalTypes";
import GlobalModal from "./components/GlobalModal";

const App: React.FC = () => {
  const [message, setMessage] = useState<string | undefined>("");
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [savedPos, setSavedPos] = useState<Positions[]>([]);
  const select = useRef<HTMLIonSelectElement>(null) as React.RefObject<HTMLIonSelectElement>;
  const input = useRef<HTMLIonInputElement>(null) as React.RefObject<HTMLIonInputElement>;
  const modalGo = useRef<HTMLIonModalElement>(null) as React.RefObject<HTMLIonModalElement>;
  const modalSave = useRef<HTMLIonModalElement>(null) as React.RefObject<HTMLIonModalElement>;

  const onWillDismissSave = async (event: CustomEvent) => {
    const role = event.detail.role;
    if (role === "confirm") {
      const positionName = event.detail.data;
      doSave(positionName);
    }
  };

  const onWillDismissGo = async (event: CustomEvent) => {
    const role = event.detail.role;
    if (role === "confirm") {

      const positionName = event.detail.data;
      const position = savedPos.find((p) => p.name === positionName)?.coords;
      if (!position) return;
      console.log("Confirm!", position);
      // Open native maps via geo: URI (Android) or maps.apple.com (iOS)
      // We'll attempt both via App openUrl handled natively in capacitor
      const geo = `geo:${position.lat},${position.lng}?q=${position.lat},${position.lng}`;
      const apple = `https://maps.apple.com/?daddr=${position.lat},${position.lng}&dirflg=d`;
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
    }
  };

  const doSave = useCallback(async (positionName?: string) => {
    const pos = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 8000, // facoltativo
      maximumAge: 0, // evita cache
    });

    const address = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
    positionName = positionName ? positionName : address

    const p: Positions = {
      coords: { lat: pos.coords.latitude, lng: pos.coords.longitude },
      name: positionName ? positionName : address,
      address: address,
      timestamp: Date.now()
    };

    savedPos.push(p);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedPos));
    setSavedPos([...savedPos]);
    // minimal feedback
    setMessage(`Bene Nino, hai salvato la posizione "${positionName}"`);
    setIsOpen(true);
  }, [savedPos]);


  const reverseGeocode = async (lat: number, lng: number) => {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
    );
    const data = await res.json();
    return data.display_name as string;
  };

  const createElemForGo = useCallback((): JSX.Element => {
    let p: Positions[] | null = null;
    if (savedPos?.length === 0) {
      const s: string | null = localStorage.getItem(STORAGE_KEY);
      if (!s) return <></>;
      p = JSON.parse(s);
    } else {
      p = savedPos;
    }
    return (
      <IonSelect
        ref={select}
        aria-label="Position"
        placeholder="Seleziona una posizione"
      >
        {p &&
          p.map((pos, index) => (
            <IonSelectOption key={`pos-${index}`}>{pos.name}</IonSelectOption>
          ))}
      </IonSelect>
    );
  }, [savedPos]);

  const createElemForSave = useCallback((): JSX.Element => {
    return (
      <div>
        <IonLabel position="stacked" className="ion-text-wrap full-label">
          Dai un nome alla posizione o lascia in bianco per usare l'indirizzo
        </IonLabel>
        <IonInput
          ref={input}
          aria-label="Position"
          maxlength={20}
        />
      </div>
    );
  }, []);

  useEffect(() => {
    // Chiede permessi appena l'app si avvia
    (async () => {
      if (Capacitor.isNativePlatform()) {
        try {
          const status = await Geolocation.requestPermissions();
          console.log("Permessi location:", status);
        } catch (e) {
          console.error("Errore richiesta permessi", e);
        }
      }
    })();

    if (savedPos.length === 0) {
      const s = localStorage.getItem(STORAGE_KEY);
      if (s) {
        const parsed = JSON.parse(s);
        if (Array.isArray(parsed)) {
          const newDate = new Date();
          newDate.setDate(newDate.getDate() - 5);
          parsed.filter((p) => {
            if (p.timestamp) {
              const d = new Date(p.timestamp);
              return d >= newDate;
            }
            return false;
          });
        }

        setSavedPos(parsed);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(savedPos));
      }
    }

    // // listen for deep links / shortcuts
    // const handlerAppUrlOpen = CapacitorApp.addListener(
    //   "appUrlOpen",
    //   (data: AppUrlOpenData) => {
    //     try {
    //       const url = new URL(data.url);
    //       const action = url.searchParams.get("action");
    //       if (action === "save") doSave("Shortcut Save");
    //       if (action === "go") doGo();
    //     } catch (e) {
    //       console.log(e);
    //     }
    //   }
    // );

    const handlerBackButton = CapacitorApp.addListener("backButton", () => {
      // chiude l'app se premuto il tasto fisico
      CapacitorApp.exitApp();
    });

    return () => {
      // handlerAppUrlOpen.then((h) => h.remove());
      handlerBackButton.then((h) => h.remove());
    };
  }, []);

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
                <IonButton
                  expand="block"
                  className="full-btn save"
                  id="open-modal-save"
                >
                  Nino, cliccami per salvare la posizione della tua auto.
                </IonButton>
              </IonCol>
            </IonRow>

            <IonRow className="half-row">
              <IonCol className="half-col">
                <IonButton
                  expand="block"
                  className="full-btn go"
                  id="open-modal-go"
                >
                  Nino, cliccami per scoprire dove hai parcheggiato.
                </IonButton>
              </IonCol>
            </IonRow>
          </IonGrid>
          <IonToast
            className="custom-toast"
            isOpen={isOpen}
            message={message}
            duration={5000}
            onDidDismiss={() => setIsOpen(false)}
            position="middle"
          ></IonToast>
        </IonContent>
      </IonPage>
      <GlobalModal
        onWillDismiss={onWillDismissSave}
        callback={createElemForSave}
        input={input}
        name="open-modal-save"
        modal={modalSave}
      />
      <GlobalModal
        onWillDismiss={onWillDismissGo}
        callback={createElemForGo}
        input={select}
        name="open-modal-go"
        modal={modalGo}
      />
    </IonApp>
  );
};

export default App;
