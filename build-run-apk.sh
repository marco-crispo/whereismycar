npm run build:sync
cd android
./gradlew assembleDebug
cd ..
npx cap run android --target=RFCY40H4NTN