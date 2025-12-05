import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonItem,
} from "@ionic/react";
import React, { JSX } from "react";

interface ContainerProps {
  onWillDismiss?: (event: CustomEvent) => void;
  callback?: () => JSX.Element;
  input: React.RefObject<HTMLIonSelectElement | HTMLIonInputElement>;
  name: string;
  modal: React.RefObject<HTMLIonModalElement>;
}

const GlobalModal: React.FC<ContainerProps> = ({ onWillDismiss, input, name, callback, modal }) => {

  const confirm = () => {
    modal.current?.dismiss(input.current?.value, "confirm");
  };


  return (
    <IonModal
      ref={modal}
      trigger={name}
      onWillDismiss={(event) => onWillDismiss?.(event)}
    >
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton onClick={() => modal.current?.dismiss()}>
              ANNULLA
            </IonButton>
          </IonButtons>
          <IonTitle class="ion-text-center">BENVENUTO</IonTitle>
          <IonButtons slot="end">
            <IonButton strong={true} onClick={() => confirm()}>
              CONFERMA
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonItem className="center">{callback?.()}</IonItem>
      </IonContent>
    </IonModal>
  );
};

export default GlobalModal;

