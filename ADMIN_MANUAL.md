# Admin Manual - Quiz Player App

## English

### Overview
This manual covers the administrative functions and setup procedures for the Quiz Player application. Administrators can configure player devices, manage connections, and monitor system status.

### Accessing the Admin Panel

#### Method 1: Hidden Access (Recommended)
1. On any screen with connection status (bottom of screen)
2. Quickly tap the "WebSocket" text **4 times within 2 seconds**
3. Admin login screen will appear
4. Enter admin password: `12345678`
5. Tap "Submit" to access admin settings

#### Method 2: Direct Navigation (Development)
- If navigation is exposed, admin screen may be directly accessible
- This method depends on app configuration

### Admin Panel Features

#### 1. Seat Number Configuration
- **Purpose**: Assigns unique identifier to each player device
- **Format**: Positive integer (1, 2, 3, etc.)
- **Usage**: 
  - Each device must have a unique seat number
  - Server uses this to track individual players
  - Essential for player identification and scoring
- **Validation**: Must be a positive whole number

#### 2. Server IP Configuration
- **Purpose**: Specifies the quiz server address
- **Formats Accepted**:
  - IP Address: `192.168.1.100`
  - Localhost: `localhost` (for local testing)
  - Domain names may work depending on network setup
- **Usage**:
  - Must match the quiz server's network address
  - All devices should connect to the same server
  - Test connection after setting
- **Validation**: Basic IP format checking (x.x.x.x) or localhost

#### 3. Language Selection
- **Options**: English (en) or Ukrainian (uk)
- **Effects**:
  - Changes entire interface language
  - Affects keyboard layout for text input questions
  - Updates all text, buttons, and messages
  - Applies immediately after selection

#### 4. Connection Status Monitoring
- **WebSocket Status**: Real-time connection state
  - **Connected** (Green): Successfully connected to server
  - **Connecting** (Orange): Attempting to establish connection
  - **Disconnected** (Red): No connection or connection lost
  - **Error** (Red): Connection failed with error details

#### 5. System Information Display
- **Lives**: Shows remaining lives/chances (if applicable)
- **Player Status**: Current game state
- **Error Details**: Specific error messages for troubleshooting

### Setup Procedures

#### Initial Device Setup
1. **Access Admin Panel**: Use hidden tap method
2. **Set Seat Number**: Assign unique number for each device
3. **Configure Server IP**: Enter quiz server address
4. **Select Language**: Choose appropriate interface language
5. **Save Settings**: Tap "Save" button
6. **Verify Connection**: Check connection status indicator
7. **Test Functionality**: Return to main screen and verify operation

#### Bulk Device Configuration
For multiple devices:
1. Configure one device completely
2. Note the server IP address
3. For each additional device:
   - Access admin panel
   - Set unique seat number (increment: 1, 2, 3, etc.)
   - Use same server IP
   - Set same language preference
   - Save and verify connection

#### Network Setup Requirements
- **Server Accessibility**: Quiz server must be reachable from player devices
- **Port Configuration**: Ensure WebSocket ports are open (typically 8080 or 3000)
- **Firewall Settings**: Allow WebSocket connections through network firewalls
- **WiFi Network**: All devices should be on same network as server (recommended)

### Troubleshooting

#### Connection Issues
1. **Verify Server IP**: Double-check server address
2. **Network Connectivity**: Ensure device has internet/network access
3. **Server Status**: Confirm quiz server is running
4. **Firewall**: Check for blocking of WebSocket connections
5. **Port Availability**: Verify server port is accessible

#### Seat Number Conflicts
- **Symptom**: Multiple devices with same seat number
- **Solution**: Assign unique numbers to each device
- **Prevention**: Maintain a device assignment list

#### Language/Keyboard Issues
- **Symptom**: Wrong keyboard layout appearing
- **Solution**: Change language setting in admin panel
- **Note**: Ukrainian layout has 32 letters, English has 26

#### Authentication Problems
- **Wrong Password**: Default is `12345678`
- **Access Denied**: Verify exact tap timing (4 taps in 2 seconds)
- **Panel Not Appearing**: Try tapping sequence again

### Security Considerations

#### Password Management
- **Default Password**: `12345678`
- **Recommendation**: Change default password in production
- **Access Control**: Limit admin access to authorized personnel only

#### Network Security
- **Internal Network**: Use internal network for quiz server when possible
- **Public Networks**: Avoid public WiFi for sensitive quizzes
- **Encryption**: Ensure WebSocket connections use secure protocols when available

### Maintenance

#### Regular Checks
- **Connection Status**: Monitor all devices for stable connections
- **Battery Levels**: Ensure devices are charged during events
- **App Updates**: Keep app updated to latest version
- **Network Performance**: Test network speed and stability

#### Pre-Event Checklist
1. Set up quiz server
2. Configure all player devices with admin panel
3. Verify unique seat numbers across all devices
4. Test connection to server from each device
5. Perform sample question test
6. Confirm all keyboards work correctly
7. Brief players on device usage

### Advanced Configuration

#### Development/Testing
- **Localhost Testing**: Use `localhost` for local server testing
- **Debug Mode**: Additional logging may be available in development builds
- **Network Diagnostics**: Use connection status for troubleshooting

#### Custom Settings
- **Password Modification**: Requires code changes in AdminScreen.tsx
- **Additional Languages**: Requires translation files and keyboard layouts
- **Server Endpoints**: May require modification for different server setups

---

## Українська

### Огляд
Цей посібник охоплює адміністративні функції та процедури налаштування для додатку Quiz Player. Адміністратори можуть налаштовувати пристрої гравців, керувати з'єднаннями та відстежувати стан системи.

### Доступ до Панелі Адміністратора

#### Метод 1: Прихований Доступ (Рекомендований)
1. На будь-якому екрані зі статусом з'єднання (внизу екрана)
2. Швидко натисніть текст "WebSocket" **4 рази протягом 2 секунд**
3. З'явиться екран входу адміністратора
4. Введіть пароль адміністратора: `12345678`
5. Натисніть "Підтвердити" для доступу до налаштувань

#### Метод 2: Пряма Навігація (Розробка)
- Якщо навігація відкрита, екран адміністратора може бути доступний безпосередньо
- Цей метод залежить від конфігурації додатку

### Функції Панелі Адміністратора

#### 1. Конфігурація Номера Місця
- **Призначення**: Присвоює унікальний ідентифікатор кожному пристрою гравця
- **Формат**: Додатне ціле число (1, 2, 3, тощо)
- **Використання**: 
  - Кожен пристрій повинен мати унікальний номер місця
  - Сервер використовує це для відстеження окремих гравців
  - Необхідно для ідентифікації гравця та підрахунку очок
- **Валідація**: Повинно бути додатним цілим числом

#### 2. Конфігурація IP Сервера
- **Призначення**: Вказує адресу сервера вікторини
- **Прийняті Формати**:
  - IP Адреса: `192.168.1.100`
  - Localhost: `localhost` (для локального тестування)
  - Доменні імена можуть працювати залежно від налаштувань мережі
- **Використання**:
  - Повинна збігатися з мережевою адресою сервера вікторини
  - Всі пристрої повинні підключатися до одного сервера
  - Перевірте з'єднання після налаштування
- **Валідація**: Базова перевірка формату IP (x.x.x.x) або localhost

#### 3. Вибір Мови
- **Варіанти**: Англійська (en) або Українська (uk)
- **Ефекти**:
  - Змінює мову всього інтерфейсу
  - Впливає на розкладку клавіатури для текстових запитань
  - Оновлює весь текст, кнопки та повідомлення
  - Застосовується негайно після вибору

#### 4. Моніторинг Статусу З'єднання
- **Статус WebSocket**: Стан з'єднання в реальному часі
  - **Підключено** (Зелений): Успішно підключено до сервера
  - **Підключення** (Помаранчевий): Спроба встановити з'єднання
  - **Відключено** (Червоний): Немає з'єднання або з'єднання втрачено
  - **Помилка** (Червоний): З'єднання не вдалося з деталями помилки

#### 5. Відображення Системної Інформації
- **Статус Гравця**: Поточний стан гри
- **Деталі Помилок**: Конкретні повідомлення про помилки для усунення неполадок

### Процедури Налаштування

#### Початкове Налаштування Пристрою
1. **Доступ до Панелі Адміністратора**: Використайте прихований метод натискання
2. **Встановіть Номер Місця**: Присвойте унікальний номер для кожного пристрою
3. **Налаштуйте IP Сервера**: Введіть адресу сервера вікторини
4. **Оберіть Мову**: Виберіть відповідну мову інтерфейсу
5. **Збережіть Налаштування**: Натисніть кнопку "Зберегти"
6. **Перевірте З'єднання**: Перевірте індикатор статусу з'єднання
7. **Протестуйте Функціональність**: Поверніться до головного екрана та перевірте роботу

#### Масове Налаштування Пристроїв
Для кількох пристроїв:
1. Повністю налаштуйте один пристрій
2. Запишіть IP-адресу сервера
3. Для кожного додаткового пристрою:
   - Увійдіть в панель адміністратора
   - Встановіть унікальний номер місця (збільшуйте: 1, 2, 3, тощо)
   - Використовуйте той самий IP сервера
   - Встановіть ту саму мову
   - Збережіть та перевірте з'єднання

#### Вимоги до Налаштування Мережі
- **Доступність Сервера**: Сервер вікторини повинен бути доступний з пристроїв гравців
- **Конфігурація Портів**: Переконайтеся, що порти WebSocket відкриті (зазвичай 5000)
- **Налаштування Брандмауера**: Дозвольте з'єднання WebSocket через мережеві брандмауери
- **WiFi Мережа**: Всі пристрої повинні бути в тій самій мережі, що й сервер (рекомендовано)

### Вирішення Проблем

#### Проблеми З'єднання
1. **Перевірте IP Сервера**: Двічі перевірте адресу сервера
2. **Мережева Підключеність**: Переконайтеся, що пристрій має доступ до інтернету/мережі
3. **Статус Сервера**: Підтвердьте, що сервер вікторини працює
4. **Брандмауер**: Перевірте блокування з'єднань WebSocket
5. **Доступність Порту**: Перевірте, що порт сервера доступний

#### Конфлікти Номерів Місць
- **Симптом**: Кілька пристроїв з однаковим номером місця
- **Рішення**: Присвойте унікальні номери кожному пристрою
- **Запобігання**: Ведіть список призначень пристроїв

#### Проблеми з Мовою/Клавіатурою
- **Симптом**: З'являється неправильна розкладка клавіатури
- **Рішення**: Змініть налаштування мови в панелі адміністратора
- **Примітка**: Українська розкладка має 32 літери, англійська - 26

#### Проблеми Автентифікації
- **Неправильний Пароль**: Стандартний `12345678`
- **Доступ Заборонено**: Перевірте точність часу натискання (4 натискання за 2 секунди)
- **Панель Не З'являється**: Спробуйте послідовність натискань знову

### Міркування Безпеки

#### Керування Паролями
- **Стандартний Пароль**: `12345678`
- **Рекомендація**: Змініть стандартний пароль у виробництві
- **Контроль Доступу**: Обмежте доступ адміністратора лише авторизованим особам

#### Мережева Безпека
- **Внутрішня Мережа**: Використовуйте внутрішню мережу для сервера вікторини коли можливо
- **Публічні Мережі**: Уникайте публічного WiFi для конфіденційних вікторин
- **Шифрування**: Забезпечте використання безпечних протоколів для з'єднань WebSocket коли доступно

### Обслуговування

#### Регулярні Перевірки
- **Статус З'єднання**: Відстежуйте всі пристрої для стабільних з'єднань
- **Рівні Батареї**: Забезпечте зарядженість пристроїв під час заходів
- **Оновлення Додатку**: Тримайте додаток оновленим до останньої версії
- **Продуктивність Мережі**: Тестуйте швидкість та стабільність мережі

#### Чек-лист Перед Заходом
1. Налаштуйте сервер вікторини
2. Налаштуйте всі пристрої гравців через панель адміністратора
3. Перевірте унікальність номерів місць на всіх пристроях
4. Протестуйте з'єднання з сервером з кожного пристрою
5. Виконайте тестове запитання
6. Підтвердьте правильну роботу всіх клавіатур
7. Проінструктуйте гравців щодо використання пристроїв

### Розширена Конфігурація

#### Розробка/Тестування
- **Тестування Localhost**: Використовуйте `localhost` для тестування локального сервера
- **Режим Налагодження**: Додаткове логування може бути доступне в збірках для розробки
- **Мережева Діагностика**: Використовуйте статус з'єднання для усунення неполадок

#### Індивідуальні Налаштування
- **Модифікація Пароля**: Потребує змін коду в AdminScreen.tsx
- **Додаткові Мови**: Потребує файлів перекладу та розкладок клавіатури
- **Кінцеві Точки Сервера**: Можуть потребувати модифікації для різних налаштувань сервера
