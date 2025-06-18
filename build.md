Build command:

```bash
eas build -p android --local --profile preview
```

to enable http and ws connection insert into `app.json`:

```ts
  "expo": {
    "plugins": [
      [
        "expo-dev-client",
        {
          "launchMode": "most-recent"
        }
      ],
      "expo-router",
      [
        "expo-build-properties",
        {
          "android": {
            "usesCleartextTraffic": true
          }
        }
      ]
    ],
```