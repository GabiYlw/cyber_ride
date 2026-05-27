export type Question = {
  id: number;
  question_text: string;
  options: string[];
  correct_answer: string;
  explanation: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
};

export type Decision = {
  id: number;
  text: string;
  xpDelta: number;
  result: 'correct' | 'partial' | 'wrong';
  feedback: string;
};

export type Scenario = {
  alertTitle: string;
  description: string;
  threats: string[];
  source: string;
  decisions: Decision[];
};

export type Mission = {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  description: string;
  difficulty: 'ROOKIE' | 'AGENT' | 'EXPERT' | 'ELITE';
  difficultyColor: string;
  scenario: Scenario;
  questions: Question[];
};

export const MISSIONS: Mission[] = [
  {
    id: 'can_bus',
    number: 1,
    title: 'CAN BUS INFILTRATION',
    subtitle: 'Controller Area Network Attack',
    description: 'Infiltrează rețeaua CAN Bus și identifică vulnerabilitățile ECU-urilor vehiculului.',
    difficulty: 'AGENT',
    difficultyColor: '#ffa500',
    scenario: {
      alertTitle: 'ALERTĂ CAN BUS',
      description: 'Un atacator a obținut acces fizic la portul OBD-II și injectează comenzi malițioase în rețeaua CAN Bus a vehiculului tău.',
      threats: ['Mesaje CAN neautorizate detectate', 'Tentativă override frâne ABS', 'Acces ECU motor identificat'],
      source: 'OBD-II PORT — PHYSICAL ACCESS',
      decisions: [
        { id: 1, text: 'Deconectez dispozitivul OBD-II și trag imediat pe dreapta', xpDelta: 100, result: 'correct', feedback: 'DECIZIE OPTIMĂ: Izolarea fizică a rețelei CAN Bus oprește atacul și protejează sistemele critice ale vehiculului.' },
        { id: 2, text: 'Continui să conduc și ignor alertele', xpDelta: -50, result: 'wrong', feedback: 'DECIZIE GREȘITĂ: Ignorarea unui atac activ permite hackerului să continue injectarea de comenzi — risc major pentru siguranță.' },
        { id: 3, text: 'Repornesc vehiculul pentru a reseta sistemele', xpDelta: 25, result: 'partial', feedback: 'DECIZIE PARȚIALĂ: Repornirea poate întrerupe temporar atacul, dar nu elimină accesul fizic la portul OBD-II.' },
      ],
    },
    questions: [
      {
        id: 1,
        question_text: 'Ce protocol folosește sistemul CAN Bus în vehiculele moderne?',
        options: ['Controller Area Network', 'Cloud Access Network', 'Cyber Attack Node', 'Connected Automotive Network'],
        correct_answer: 'Controller Area Network',
        explanation: 'CAN Bus (Controller Area Network) este protocolul standard pentru comunicarea între ECU-urile vehiculului.',
        category: 'CAN Bus',
        difficulty: 'medium',
      },
      {
        id: 2,
        question_text: 'Care este principalul vector de atac prin OBD-II port?',
        options: ['Injectarea de comenzi CAN', 'SQL Injection', 'DDoS Attack', 'Phishing'],
        correct_answer: 'Injectarea de comenzi CAN',
        explanation: 'Portul OBD-II oferă acces direct la rețeaua CAN, permițând injectarea de mesaje malițioase.',
        category: 'OBD-II',
        difficulty: 'hard',
      },
      {
        id: 3,
        question_text: "Ce înseamnă 'ECU' în contextul vehiculelor?",
        options: ['Electronic Control Unit', 'External Cyber Unit', 'Engine Core Update', 'Encrypted Control Upload'],
        correct_answer: 'Electronic Control Unit',
        explanation: 'ECU (Electronic Control Unit) sunt calculatoarele care controlează funcțiile vehiculului.',
        category: 'ECU',
        difficulty: 'easy',
      },
      {
        id: 4,
        question_text: 'Care metodă de autentificare este recomandată pentru V2X comunicare?',
        options: ['Certificate-based PKI', 'Parole simple', 'MAC Address filtering', 'IP Whitelisting'],
        correct_answer: 'Certificate-based PKI',
        explanation: 'PKI (Public Key Infrastructure) cu certificate digitale oferă autentificare robustă pentru comunicarea V2X.',
        category: 'V2X',
        difficulty: 'hard',
      },
      {
        id: 5,
        question_text: 'Ce tip de atac vizează sistemul de keyless entry al unui vehicul?',
        options: ['Relay Attack', 'Brute Force', 'Man-in-the-Browser', 'ARP Spoofing'],
        correct_answer: 'Relay Attack',
        explanation: 'Relay Attack amplifica semnalul cheii auto pentru a debloca vehiculul de la distanță fără cheia fizică.',
        category: 'Keyless',
        difficulty: 'medium',
      },
    ],
  },
  {
    id: 'obd2',
    number: 2,
    title: 'OBD-II EXPLOITATION',
    subtitle: 'Diagnostic Port Attack',
    description: 'Exploatează portul de diagnosticare OBD-II pentru a accesa și manipula sistemele vehiculului.',
    difficulty: 'AGENT',
    difficultyColor: '#ffa500',
    scenario: {
      alertTitle: 'ALERTĂ OBD-II',
      description: 'Sistemul de monitorizare a flotei a detectat un adaptor neautorizat conectat la portul OBD-II al unui vehicul de companie.',
      threats: ['Adaptor ELM327 neautorizat detectat', 'Interceptare mesaje diagnosticare', 'Exfiltrare date vehicul în curs'],
      source: 'FLEET MONITOR — OBD-II SCANNER',
      decisions: [
        { id: 1, text: 'Izoleze vehiculul, elimin dispozitivul și raportez la securitate', xpDelta: 100, result: 'correct', feedback: 'DECIZIE OPTIMĂ: Izolarea și raportarea imediată permite anchetarea incidentului și previne exfiltrarea datelor vehiculului.' },
        { id: 2, text: 'Documentez situația dar las vehiculul în funcțiune', xpDelta: 20, result: 'partial', feedback: 'DECIZIE PARȚIALĂ: Documentarea este utilă, dar menținerea vehiculului activ permite continuarea exfiltrării datelor.' },
        { id: 3, text: 'Resetez portul OBD-II și continui operațiunile', xpDelta: -50, result: 'wrong', feedback: 'DECIZIE GREȘITĂ: Resetarea fără raportare elimină dovezile și nu adresează vulnerabilitatea de securitate.' },
      ],
    },
    questions: [
      {
        id: 1,
        question_text: 'Care este principalul risc de securitate al portului OBD-II?',
        options: ['Acces direct la rețeaua CAN Bus', 'Descărcarea bateriei', 'Supraîncărcarea GPS-ului', 'Dezactivarea radioului'],
        correct_answer: 'Acces direct la rețeaua CAN Bus',
        explanation: 'Portul OBD-II oferă acces neprotejat la rețeaua CAN Bus, permițând unui atacator să injecteze mesaje malițioase.',
        category: 'OBD-II',
        difficulty: 'medium',
      },
      {
        id: 2,
        question_text: 'Ce adaptor este frecvent utilizat pentru a interfața cu portul OBD-II în cercetarea de securitate?',
        options: ['ELM327', 'Raspberry Pi Zero', 'Arduino Mega', 'Hub USB'],
        correct_answer: 'ELM327',
        explanation: 'Adaptorul ELM327 convertește protocoalele OBD-II în comunicare serială, folosit atât în diagnosticare cât și în cercetarea de securitate.',
        category: 'OBD-II',
        difficulty: 'easy',
      },
      {
        id: 3,
        question_text: 'Ce tip de atac poate fi lansat prin portul OBD-II?',
        options: ['Injectare de mesaje CAN', 'SQL Injection', 'DNS Spoofing', 'CSRF Attack'],
        correct_answer: 'Injectare de mesaje CAN',
        explanation: 'Prin portul OBD-II, atacatorii pot injecta mesaje CAN arbitrare, controlând potențial funcțiile vehiculului.',
        category: 'OBD-II',
        difficulty: 'hard',
      },
      {
        id: 4,
        question_text: 'Ce standard definește interfața OBD-II?',
        options: ['SAE J1979', 'IEEE 802.11', 'RFC 2616', 'ISO 27001'],
        correct_answer: 'SAE J1979',
        explanation: 'SAE J1979 definește standardul OBD-II, specificând protocoalele de comunicare utilizate pentru diagnosticarea vehiculelor.',
        category: 'OBD-II',
        difficulty: 'hard',
      },
      {
        id: 5,
        question_text: 'Cum poate fi redusă suprafața de atac OBD-II?',
        options: ['Blocare fizică a portului + monitorizare acces', 'Instalare antivirus pe ECU', 'Criptarea sistemului de evacuare', 'Dezactivarea modulului GPS'],
        correct_answer: 'Blocare fizică a portului + monitorizare acces',
        explanation: 'Măsurile de securitate fizică, cum ar fi blocarea portului și monitorizarea accesului neautorizat, sunt principalele apărări împotriva atacurilor OBD-II.',
        category: 'OBD-II',
        difficulty: 'medium',
      },
    ],
  },
  {
    id: 'keyless',
    number: 3,
    title: 'KEYLESS RELAY ATTACK',
    subtitle: 'Wireless Entry Exploitation',
    description: 'Interceptează și amplifică semnalele cheilor fără fir pentru a compromite sistemul de intrare al vehiculului.',
    difficulty: 'EXPERT',
    difficultyColor: '#ff4444',
    scenario: {
      alertTitle: 'ALERTĂ KEYLESS',
      description: 'Sistemul anti-furt a detectat o tentativă de deblocare prin amplificarea semnalului cheii fob în parcarea centrului comercial.',
      threats: ['Semnal cheie amplificat detectat', 'Tentativă deblocare la 45m distanță', 'Doi suspecți cu echipament RF identificați'],
      source: 'ANTI-THEFT SYSTEM — RF SIGNAL MONITOR',
      decisions: [
        { id: 1, text: 'Activez blocarea PIN suplimentară și raportez la poliție', xpDelta: 100, result: 'correct', feedback: 'DECIZIE OPTIMĂ: PIN-ul adaugă un strat de securitate, iar raportarea permite anchetarea tentativei de relay attack.' },
        { id: 2, text: 'Schimb bateria cheii — probabil emite semnal prea puternic', xpDelta: -50, result: 'wrong', feedback: 'DECIZIE GREȘITĂ: Bateria nu are legătură cu relay attack-ul. Aceasta nu rezolvă vulnerabilitatea și atacul poate continua.' },
        { id: 3, text: 'Verific mașina fizic și încerc să identific atacatorii', xpDelta: 30, result: 'partial', feedback: 'DECIZIE PARȚIALĂ: Verificarea fizică este corectă, dar confruntarea directă fără suport polițienesc poate fi periculoasă.' },
      ],
    },
    questions: [
      {
        id: 1,
        question_text: 'Ce este un Relay Attack pe un sistem de intrare fără cheie?',
        options: ['Amplificarea semnalului cheii pentru a debloca mașina de la distanță', 'Blocarea semnalului cheii', 'Înlocuirea cheii cu un dispozitiv clonat', 'Interceptarea și redirecționarea semnalului GPS'],
        correct_answer: 'Amplificarea semnalului cheii pentru a debloca mașina de la distanță',
        explanation: 'Într-un Relay Attack, doi atacatori folosesc dispozitive pentru a amplifica și relaya semnalul cheii, păcălind mașina că aceasta este în apropiere.',
        category: 'Keyless',
        difficulty: 'medium',
      },
      {
        id: 2,
        question_text: 'Pe ce frecvență operează majoritatea sistemelor de intrare fără cheie?',
        options: ['315 MHz sau 433.92 MHz', '2.4 GHz', '5 GHz', '900 MHz'],
        correct_answer: '315 MHz sau 433.92 MHz',
        explanation: 'Majoritatea sistemelor keyless folosesc 315 MHz (America de Nord) sau 433.92 MHz (Europa) pentru comunicare radio.',
        category: 'Keyless',
        difficulty: 'hard',
      },
      {
        id: 3,
        question_text: 'Ce tehnologie poate preveni atacurile relay pe sistemele keyless?',
        options: ['Ultra-Wideband (UWB)', 'Bluetooth 4.0', 'Wi-Fi Direct', 'NFC'],
        correct_answer: 'Ultra-Wideband (UWB)',
        explanation: 'UWB permite măsurarea precisă a distanței, prevenind atacurile relay prin verificarea că cheia este efectiv aproape de vehicul.',
        category: 'Keyless',
        difficulty: 'hard',
      },
      {
        id: 4,
        question_text: 'Care este o contramăsură simplă împotriva atacurilor relay keyless?',
        options: ['Depozitarea cheii într-o cușcă Faraday', 'Schimbarea bateriei cheii', 'Înmatricularea vehiculului în altă țară', 'Folosirea unui blocaj de volan'],
        correct_answer: 'Depozitarea cheii într-o cușcă Faraday',
        explanation: 'O cușcă Faraday blochează toate semnalele radio, împiedicând atacatorii să detecteze și să amplifice semnalul cheii.',
        category: 'Keyless',
        difficulty: 'easy',
      },
      {
        id: 5,
        question_text: 'Ce este "signal jamming" în contextul sistemelor keyless?',
        options: ['Blocarea semnalului de blocare astfel încât mașina să rămână descuiată', 'Amplificarea semnalului pentru a extinde raza de acțiune', 'Criptarea comunicării cheie-mașină', 'Clonarea semnăturii cheii'],
        correct_answer: 'Blocarea semnalului de blocare astfel încât mașina să rămână descuiată',
        explanation: 'Signal jamming interferează cu comanda de blocare, lăsând mașina descuiată în timp ce proprietarul crede că este securizată.',
        category: 'Keyless',
        difficulty: 'medium',
      },
    ],
  },
  {
    id: 'v2x',
    number: 4,
    title: 'V2X NETWORK COMPROMISE',
    subtitle: 'Vehicle-to-Everything Security',
    description: 'Analizează și exploatează vulnerabilitățile rețelei de comunicații vehicul-la-tot (V2X).',
    difficulty: 'EXPERT',
    difficultyColor: '#ff4444',
    scenario: {
      alertTitle: 'ALERTĂ V2X',
      description: 'Sistemul V2X primește mesaje contradictorii — un vehicul fantomă este injectat pe traseul tău, indicând o coliziune iminentă.',
      threats: ['Vehicul fantomă injectat în rețeaua V2X', 'Mesaje de urgență false detectate', 'Perturbarea gestionării traficului local'],
      source: 'V2X NETWORK — TRAFFIC MANAGEMENT HUB',
      decisions: [
        { id: 1, text: 'Dezactivez V2X, reduc viteza și mă bazez pe senzori proprii', xpDelta: 100, result: 'correct', feedback: 'DECIZIE OPTIMĂ: Ignorând datele compromise și bazându-te pe sistemele locale fiabile, eviți o coliziune cauzată de atacator.' },
        { id: 2, text: 'Accelerez pentru a depăși rapid vehiculul fantomă', xpDelta: -50, result: 'wrong', feedback: 'DECIZIE GREȘITĂ: Accelerarea bazată pe date false poate duce la o coliziune reală cu vehicule sau obstacole din trafic.' },
        { id: 3, text: 'Alertez autoritățile și opresc vehiculul în siguranță', xpDelta: 50, result: 'partial', feedback: 'DECIZIE PARȚIALĂ: Alertarea este corectă, dar oprirea completă pe un drum aglomerat fără zonă sigură poate fi periculoasă.' },
      ],
    },
    questions: [
      {
        id: 1,
        question_text: 'Ce înseamnă acronimul V2X?',
        options: ['Vehicle-to-Everything', 'Vehicle-to-XML', 'Virtual-to-External', 'Vehicle-to-X-ray'],
        correct_answer: 'Vehicle-to-Everything',
        explanation: 'V2X (Vehicle-to-Everything) cuprinde toate comunicațiile wireless între vehicule, infrastructură, rețele și pietoni.',
        category: 'V2X',
        difficulty: 'easy',
      },
      {
        id: 2,
        question_text: 'Ce standard guvernează securitatea V2X în Europa?',
        options: ['ETSI ITS (Intelligent Transportation Systems)', 'IEEE 802.11p exclusiv', 'GDPR', 'ISO 9001'],
        correct_answer: 'ETSI ITS (Intelligent Transportation Systems)',
        explanation: 'ETSI ITS definește standardele de securitate pentru comunicațiile V2X în Europa, inclusiv managementul certificatelor.',
        category: 'V2X',
        difficulty: 'hard',
      },
      {
        id: 3,
        question_text: 'Ce tip de atac vizează infrastructura V2X prin inundarea cu mesaje false?',
        options: ['Sybil Attack', 'Phishing Attack', 'SQL Injection', 'Ransomware'],
        correct_answer: 'Sybil Attack',
        explanation: 'Un Sybil Attack implică crearea de identități false multiple pentru a inunda rețeaua V2X cu mesaje false, perturbând gestionarea traficului.',
        category: 'V2X',
        difficulty: 'hard',
      },
      {
        id: 4,
        question_text: 'Cum sunt autentificate mesajele V2X?',
        options: ['Certificate digitale (PKI)', 'User și parolă', 'Filtrare MAC Address', 'IP Whitelisting'],
        correct_answer: 'Certificate digitale (PKI)',
        explanation: 'V2X folosește PKI (Public Key Infrastructure) cu certificate digitale pentru autentificarea mesajelor și verificarea identității vehiculelor.',
        category: 'V2X',
        difficulty: 'medium',
      },
      {
        id: 5,
        question_text: 'Ce este un atac "ghost vehicle" în contextul V2X?',
        options: ['Injectarea de poziții false ale vehiculelor în rețea', 'Hackuirea de la distanță a unui vehicul', 'Furtul datelor vehiculului', 'Blocarea semnalelor GPS'],
        correct_answer: 'Injectarea de poziții false ale vehiculelor în rețea',
        explanation: 'Atacurile ghost vehicle injectează date fabricate despre vehicule în rețelele V2X, putând cauza accidente reale sau evaziunea sistemelor de monitorizare.',
        category: 'V2X',
        difficulty: 'hard',
      },
    ],
  },
  {
    id: 'ecu_firmware',
    number: 5,
    title: 'ECU FIRMWARE ANALYSIS',
    subtitle: 'Embedded Controller Security',
    description: 'Analizează firmware-ul ECU pentru a identifica vulnerabilități critice în sistemele embedded ale vehiculului.',
    difficulty: 'ELITE',
    difficultyColor: '#cc00ff',
    scenario: {
      alertTitle: 'ALERTĂ FIRMWARE',
      description: 'ECU-ul principal a primit o actualizare OTA nesolicitată cu semnătură digitală invalidă în timp ce te afli pe autostradă.',
      threats: ['Firmware neautorizat în așteptare', 'Semnătură digitală invalidă detectată', 'Risc modificare comportament ECU critic'],
      source: 'ECU MONITOR — OTA UPDATE MANAGER',
      decisions: [
        { id: 1, text: 'Rejectez actualizarea, opresc vehiculul și raportez producătorului', xpDelta: 100, result: 'correct', feedback: 'DECIZIE OPTIMĂ: Refuzul firmware-ului nesemnat și raportarea protejează ECU-ul și ajută la identificarea sursei atacului.' },
        { id: 2, text: 'Accept actualizarea — poate rezolvă probleme de performanță', xpDelta: -50, result: 'wrong', feedback: 'DECIZIE GREȘITĂ: Acceptarea unui firmware cu semnătură invalidă poate compromite ECU-ul, permițând controlul de la distanță al vehiculului.' },
        { id: 3, text: 'Amân actualizarea și caut informații suplimentare', xpDelta: 25, result: 'partial', feedback: 'DECIZIE PARȚIALĂ: Amânarea este mai bună decât acceptarea, dar vehiculul rămâne expus pe durata căutării de informații.' },
      ],
    },
    questions: [
      {
        id: 1,
        question_text: 'Care este vulnerabilitatea principală în actualizările OTA ale firmware-ului ECU?',
        options: ['Lipsa verificării semnăturii digitale', 'Fișier prea mare', 'Conexiune internet lentă', 'Format de fișier incompatibil'],
        correct_answer: 'Lipsa verificării semnăturii digitale',
        explanation: 'Fără verificarea semnăturii digitale, atacatorii pot distribui firmware malițios pe care ECU-urile îl acceptă ca actualizare legitimă.',
        category: 'ECU',
        difficulty: 'hard',
      },
      {
        id: 2,
        question_text: 'Ce tehnică este folosită pentru a extrage firmware dintr-un ECU?',
        options: ['Exploatarea interfeței JTAG/SWD', 'Extracție prin USB', 'Sniffing Bluetooth', 'Captură pachete Wi-Fi'],
        correct_answer: 'Exploatarea interfeței JTAG/SWD',
        explanation: 'JTAG și SWD sunt interfețe hardware de debugging ce pot fi exploatate pentru a extrage firmware și conținutul memoriei din ECU-uri.',
        category: 'ECU',
        difficulty: 'hard',
      },
      {
        id: 3,
        question_text: 'Ce previne "Secure Boot" în contextul ECU-urilor?',
        options: ['Rularea firmware-ului neautorizat sau modificat', 'Furtul fizic al ECU-ului', 'Atacurile de descărcare a bateriei', 'GPS Spoofing'],
        correct_answer: 'Rularea firmware-ului neautorizat sau modificat',
        explanation: 'Secure Boot asigură că ECU-ul execută doar firmware verificat criptografic, prevenind rularea codului malițios.',
        category: 'ECU',
        difficulty: 'medium',
      },
      {
        id: 4,
        question_text: 'Ce tip de vulnerabilitate permite atacatorilor să suprascrie memoria ECU-ului?',
        options: ['Buffer Overflow', 'Cross-Site Scripting', 'LDAP Injection', 'XML External Entity'],
        correct_answer: 'Buffer Overflow',
        explanation: 'Vulnerabilitățile de tip buffer overflow în codul ECU permit atacatorilor să suprascrie memoria și să execute cod arbitrar.',
        category: 'ECU',
        difficulty: 'hard',
      },
      {
        id: 5,
        question_text: 'Care este scopul unui Hardware Security Module (HSM) în ECU-urile moderne?',
        options: ['Stocarea securizată a cheilor criptografice', 'Creșterea vitezei de procesare', 'Gestionarea conexiunilor Bluetooth', 'Monitorizarea consumului de combustibil'],
        correct_answer: 'Stocarea securizată a cheilor criptografice',
        explanation: 'HSM-urile oferă un mediu rezistent la manipulare pentru operațiuni criptografice și stocarea cheilor, prevenind extragerea acestora chiar dacă ECU-ul este compromis.',
        category: 'ECU',
        difficulty: 'expert' as any,
      },
    ],
  },
];
