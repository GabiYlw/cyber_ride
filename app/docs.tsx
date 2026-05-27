import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MISSIONS } from '../lib/missions';

const { height } = Dimensions.get('window');
const MONOSPACE = Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' });

type DocQuestion = {
  q: string;
  answer: string;
  explain: string;
};

type DocSection = {
  missionId: string;
  intro: string;
  questions: DocQuestion[];
};

const DOC_CONTENT: DocSection[] = [
  // ─────────────── MISIUNEA 1 — CAN BUS ───────────────
  {
    missionId: 'can_bus',
    intro:
      'CAN Bus (Controller Area Network) este protocolul standard prin care toate calculatoarele dintr-o mașină modernă (ECU-urile) vorbesc între ele. A fost creat de Bosch în anii ’80 pentru fiabilitate în medii industriale — NU pentru securitate. Mesajele circulă în clar, fără autentificare. Oricine se conectează la magistrală poate citi totul și poate trimite comenzi care vor fi acceptate ca legitime.',
    questions: [
      {
        q: 'Ce protocol folosește sistemul CAN Bus în vehiculele moderne?',
        answer: 'Controller Area Network',
        explain:
          'CAN = Controller Area Network. Este un protocol serial multi-master, conceput de Bosch în 1986, care folosește două fire torsadate (CAN-H și CAN-L) pentru rezistență la zgomot electromagnetic. Toate ECU-urile partajează aceeași magistrală și ascultă în paralel — fiecare mesaj are un ID de prioritate, iar cel mai mic ID câștigă accesul (arbitrare non-distructivă). Versiunile moderne (CAN FD, CAN XL) ating 5–10 Mbps. Celelalte variante de răspuns sunt inventate doar ca să te deruteze — „Cloud Access Network” sau „Cyber Attack Node” nu există în standardele auto.',
      },
      {
        q: 'Care este principalul vector de atac prin portul OBD-II?',
        answer: 'Injectarea de comenzi CAN',
        explain:
          'Pinii 6 și 14 ai mufei OBD-II sunt conectați FIZIC la firele CAN-H și CAN-L ale magistralei principale. Orice dispozitiv conectat acolo poate trimite frame-uri CAN cu ID-uri arbitrare — inclusiv cele folosite de ECU-ul de frânare, airbag sau motor. ECU-urile nu pot distinge un mesaj „real” de unul falsificat. Charlie Miller și Chris Valasek au demonstrat asta public în 2013 pe Toyota Prius și în 2015 pe Jeep Cherokee (controlând frânele, direcția și transmisia). SQL Injection, DDoS și Phishing sunt atacuri specifice aplicațiilor web — irelevante în contextul magistralei CAN.',
      },
      {
        q: 'Ce înseamnă „ECU” în contextul vehiculelor?',
        answer: 'Electronic Control Unit',
        explain:
          'Un ECU este un microcontroler dedicat care controlează o singură funcție: ECU motor, ECU transmisie, ECU ABS, ECU airbag, ECU infotainment etc. O mașină premium modernă conține între 70 și 150 de ECU-uri, fiecare cu propriul firmware și propria identitate pe CAN. Această distribuție crește suprafața de atac: dacă reușești să compromiți un ECU „neimportant” (de exemplu radioul sau sistemul de climatizare), îl poți folosi ca punct de pivot către ECU-urile critice de pe aceeași magistrală.',
      },
      {
        q: 'Care metodă de autentificare este recomandată pentru comunicarea V2X?',
        answer: 'Certificate-based PKI',
        explain:
          'V2X folosește un sistem PKI specializat — SCMS (Security Credential Management System) în SUA, C-ITS Trust Model în UE. Fiecare vehicul deține mii de pseudonyme — certificate digitale de scurtă durată — rotite la câteva minute pentru a împiedica urmărirea fizică a vehiculului. Fiecare mesaj este semnat cu cheia privată corespunzătoare, iar receptorii verifică semnătura înainte să acționeze. Parolele simple nu pot fi distribuite la milioane de vehicule, iar MAC filtering și IP Whitelisting nu funcționează într-o rețea ad-hoc unde mașinile apar și dispar continuu.',
      },
      {
        q: 'Ce tip de atac vizează sistemul de keyless entry al unui vehicul?',
        answer: 'Relay Attack',
        explain:
          'Atacul relay folosește doi atacatori și două dispozitive radio: unul lângă casă (unde stă cheia), altul lângă mașină. Semnalul de challenge (interogare) emis de mașină pe banda LF (~125 kHz) este captat, amplificat și retransmis lângă cheie. Cheia, crezând că e aproape de mașină, răspunde pe banda UHF (315/433 MHz) — răspuns care este la rândul lui retransmis înapoi la mașină. Tot procesul durează sub 1 secundă. Brute force nu este practic (cheile folosesc rolling code criptografic), Man-in-the-Browser este atac web, iar ARP Spoofing este atac pe rețele IP — nimic din ele nu se aplică unei chei auto pasive.',
      },
    ],
  },
  // ─────────────── MISIUNEA 2 — OBD-II ───────────────
  {
    missionId: 'obd2',
    intro:
      'OBD-II (On-Board Diagnostics, generația 2) este o mufă standardizată obligatorie în orice mașină vândută după 1996 (SUA) sau 2001 (UE). Inițial gândită pentru a permite testarea uniformă a emisiilor, oferă în realitate acces direct și neprotejat la magistralele CAN. Este, statistic, cel mai folosit punct de intrare în atacurile fizice asupra mașinilor moderne. Toate dongle-urile de „diagnoză” ieftine de pe Amazon/eBay folosesc același mecanism.',
    questions: [
      {
        q: 'Care este principalul risc de securitate al portului OBD-II?',
        answer: 'Acces direct la rețeaua CAN Bus',
        explain:
          'Pinii 6 și 14 ai mufei OBD-II merg DIRECT pe firele CAN-H și CAN-L ale magistralei principale, fără filtru, fără gateway, fără autentificare. Orice dispozitiv conectat are aceleași privilegii ca ECU-ul de motor — poate citi tot traficul și poate scrie pe magistrală. Bateria, GPS-ul și radio-ul nu sunt expuse direct prin OBD-II și nu pot fi atacate prin acest port (decât indirect, după ce compromiți ECU-ul corespunzător).',
      },
      {
        q: 'Ce adaptor este frecvent utilizat pentru a interfața cu portul OBD-II în cercetarea de securitate?',
        answer: 'ELM327',
        explain:
          'ELM327 este un microcontroler dezvoltat de ELM Electronics care traduce protocoalele OBD-II (ISO 9141-2, KWP2000, J1850, CAN) într-o interfață serială simplă (UART/Bluetooth/Wi-Fi). Costă sub 10 € și este omniprezent — exact din acest motiv este și unealta preferată a hobbyiștilor și a cercetătorilor ofensivi. Raspberry Pi Zero sau Arduino Mega sunt platforme generale care pot fi folosite cu un transceiver CAN separat, dar nu sunt adaptoare OBD-II în sine. Hub-ul USB este complet nelegat.',
      },
      {
        q: 'Ce tip de atac poate fi lansat prin portul OBD-II?',
        answer: 'Injectare de mesaje CAN',
        explain:
          'Prin OBD-II, un atacator poate trimite frame-uri CAN cu orice ID dorește — inclusiv ID-uri folosite în mod normal de ECU-ul de frânare, transmisie sau direcție. Toate celelalte ECU-uri vor accepta și acționa pe baza acestor mesaje, deoarece nu există mecanism criptografic de autentificare pe CAN clasic. SQL Injection, DNS Spoofing și CSRF sunt clase de atacuri specifice aplicațiilor web — au sens doar într-un context HTTP/SQL, nu pe o magistrală auto.',
      },
      {
        q: 'Ce standard definește interfața OBD-II?',
        answer: 'SAE J1979',
        explain:
          'SAE J1979 (echivalent ISO 15031-5) definește cererile de diagnosticare emise prin OBD-II și răspunsurile așteptate. Specifică PID-urile (Parameter IDs) — codurile numerice prin care ceri o anumită informație de la ECU (de exemplu turația, temperatura motorului, codurile DTC de eroare). IEEE 802.11 este standardul Wi-Fi, RFC 2616 este specificația HTTP/1.1, ISO 27001 este un standard de management al securității informației — toate complet nelegate de diagnosticarea auto.',
      },
      {
        q: 'Cum poate fi redusă suprafața de atac OBD-II?',
        answer: 'Blocare fizică a portului + monitorizare acces',
        explain:
          'Pentru că OBD-II este o cerință legală (nu poate fi eliminat din mașină), singurele măsuri eficiente sunt: (1) încuietori fizice tip „OBD lock” care blochează accesul mecanic la port, (2) gateway-uri CAN moderne (CAN Firewall) care filtrează ce mesaje pot trece de la OBD-II spre magistrale critice, și (3) sisteme IDS auto care detectează mesaje CAN anormale și alertează șoferul. Un „antivirus pentru ECU” nu există în sensul tradițional, criptarea sistemului de evacuare nu are sens fizic, iar dezactivarea GPS-ului nu afectează portul OBD.',
      },
    ],
  },
  // ─────────────── MISIUNEA 3 — KEYLESS ───────────────
  {
    missionId: 'keyless',
    intro:
      'Sistemele PKES (Passive Keyless Entry & Start) permit deblocarea și pornirea mașinii fără a apăsa vreun buton — doar având cheia aproape. Mașina emite continuu un câmp LF (Low Frequency, ~125 kHz) cu rază mică (1-2 m). Cheia ascultă acest câmp și, când îl detectează, răspunde pe UHF (315/433 MHz) cu un cod criptografic. Sistemul presupune că dacă răspunsul ajunge, înseamnă că cheia (și deci proprietarul) este aproape. Exact această presupunere este vulnerabilitatea fundamentală.',
    questions: [
      {
        q: 'Ce este un Relay Attack pe un sistem de intrare fără cheie?',
        answer: 'Amplificarea semnalului cheii pentru a debloca mașina de la distanță',
        explain:
          'În atacul relay, doi complici folosesc dispozitive RF coordonate. Primul stă lângă mașină și captează semnalul LF emis de ea, retransmițându-l (prin cablu, internet sau ISM) către al doilea complice aflat lângă cheie (de exemplu la ușa de la intrare în casa proprietarului). Cheia detectează câmpul „contrafăcut”, crede că e lângă mașină și răspunde pe UHF. Răspunsul este retransmis înapoi și predat mașinii — care deblochează. Echipamentul costă sub 1000 € și se poate construi cu HackRF + LimeSDR. Blocarea semnalului, clonarea fizică a cheii sau interceptarea GPS-ului sunt alte tipuri de atac, dar nu sunt „relay”.',
      },
      {
        q: 'Pe ce frecvență operează majoritatea sistemelor de intrare fără cheie?',
        answer: '315 MHz sau 433.92 MHz',
        explain:
          '315 MHz este folosit în America de Nord, 433.92 MHz în Europa și Asia — ambele sunt benzi ISM (Industrial, Scientific, Medical) nelicențiate. Această deschidere face echipamentele de recepție/emisie ieftine (RTL-SDR pentru 20 €, HackRF pentru 250 €) și accesibile oricui. 2.4 GHz este Wi-Fi/Bluetooth, 5 GHz este Wi-Fi modern, 900 MHz este folosit pentru GSM și unele rețele LoRa — niciuna nu este standard pentru PKES.',
      },
      {
        q: 'Ce tehnologie poate preveni atacurile relay pe sistemele keyless?',
        answer: 'Ultra-Wideband (UWB)',
        explain:
          'UWB transmite pulsuri radio extrem de scurte (sub-nanosecundă) pe o bandă foarte largă (>500 MHz). Pentru că semnalul este atât de scurt, se poate măsura cu precizie de centimetri cât durează drumul dus-întors între mașină și cheie — așa-numitul „time of flight”. Orice retransmisie adaugă obligatoriu o întârziere detectabilă (cel puțin câțiva nanosecundă), iar mașina refuză deblocarea. Apple AirTag, BMW Digital Key, modelele noi de Audi/Mercedes (2022+) folosesc UWB. Bluetooth 4.0 nu are precizia temporală necesară, Wi-Fi Direct este pentru transfer de date, iar NFC are rază prea mică (5 cm) ca să fie utilizabil pentru deblocare pasivă.',
      },
      {
        q: 'Care este o contramăsură simplă împotriva atacurilor relay keyless?',
        answer: 'Depozitarea cheii într-o cușcă Faraday',
        explain:
          'O cușcă Faraday este pur și simplu o cutie sau o pungă căptușită cu un material conductor (folie de aluminiu, plasă metalică). Aceasta blochează intrarea câmpurilor electromagnetice — cheia nu mai poate fi „auzită” de atacator și nici nu poate transmite. Costă între 5-20 € și este 100% eficientă cât timp cheia rămâne înăuntru. Inconvenientul: trebuie scoasă manual de fiecare dată. Schimbarea bateriei nu schimbă protocolul, înmatricularea într-o altă țară schimbă doar frecvența (atacatorul își ajustează echipamentul), iar blocajul de volan oprește furtul ulterior, nu deblocarea.',
      },
      {
        q: 'Ce este „signal jamming” în contextul sistemelor keyless?',
        answer: 'Blocarea semnalului de blocare astfel încât mașina să rămână descuiată',
        explain:
          'Când proprietarul apasă butonul de blocare al cheii, aceasta transmite un cod pe UHF. Un atacator aflat în apropiere poate emite zgomot RF pe aceeași frecvență (jamming), suprapunându-se peste semnal — mașina nu primește comanda și NU se blochează. Proprietarul aude beep-ul cheii și pleacă convins că a încuiat. Atacul este pasiv, ieftin (<50 € pentru un jammer chinezesc) și greu de detectat. Soluție: verifică VIZUAL că oglinzile se pliază sau că LED-ul interior se aprinde înainte să te îndepărtezi de mașină.',
      },
    ],
  },
  // ─────────────── MISIUNEA 4 — V2X ───────────────
  {
    missionId: 'v2x',
    intro:
      'V2X (Vehicle-to-Everything) este umbrela pentru toate comunicațiile wireless ale unui vehicul: V2V (vehicul-vehicul), V2I (vehicul-infrastructură), V2N (vehicul-rețea), V2P (vehicul-pieton). Scopul: partajarea în timp real a poziției, vitezei și intenției pentru a preveni accidente și a optimiza traficul. Folosește IEEE 802.11p (DSRC) sau C-V2X (LTE/5G). Provocarea: cum autentifici milioane de vehicule fără a permite urmărirea lor individuală?',
    questions: [
      {
        q: 'Ce înseamnă acronimul V2X?',
        answer: 'Vehicle-to-Everything',
        explain:
          '„X” este placeholder pentru orice tip de receptor: alt vehicul (V2V), o intersecție inteligentă (V2I), un smartphone de pieton (V2P), un cloud de fleet management (V2N). Tipic, fiecare vehicul transmite BSM (Basic Safety Message) la 10 Hz, conținând poziția GPS, viteza, accelerația, direcția. Aceste mesaje permit, de exemplu, ca o mașină autonomă să „vadă” după colț o altă mașină care nu e încă vizibilă optic. Variantele XML, External sau X-ray sunt invenții pentru a induce în eroare — nu există nicio relație cu vehiculele.',
      },
      {
        q: 'Ce standard guvernează securitatea V2X în Europa?',
        answer: 'ETSI ITS (Intelligent Transportation Systems)',
        explain:
          'ETSI (European Telecommunications Standards Institute) — prin grupul de lucru ITS — emite specificațiile europene pentru CAM (Cooperative Awareness Messages), DENM (Decentralized Environmental Notification Messages) și pentru sistemul PKI care le securizează. În SUA echivalentul este SAE J2735 + SCMS. IEEE 802.11p este DOAR stratul fizic/MAC (cum se transmit biții) — ETSI ITS definește straturile superioare și criptografia. GDPR e despre date personale, iar ISO 9001 e management al calității — niciuna nu se ocupă de V2X.',
      },
      {
        q: 'Ce tip de atac vizează infrastructura V2X prin inundarea cu mesaje false?',
        answer: 'Sybil Attack',
        explain:
          'Numele vine din cartea „Sybil” despre o pacientă diagnosticată cu personalități multiple. În atacul Sybil, un atacator generează zeci sau sute de identități virtuale de vehicule — fie cu certificate furate, fie exploatând vulnerabilități în emiterea de certificate. Toate „vehiculele fantomă” raportează simultan congestie pe o anumită rută pentru a redirecționa traficul real către altundeva (ex: o ambuscadă), sau supraîncarcă o intersecție inteligentă pentru a-i perturba algoritmul de semaforizare. Phishing-ul, SQL Injection-ul și ransomware-ul sunt clase complet diferite, specifice IT-ului.',
      },
      {
        q: 'Cum sunt autentificate mesajele V2X?',
        answer: 'Certificate digitale (PKI)',
        explain:
          'Fiecare mesaj V2X este semnat cu cheia privată a vehiculului, iar receptorul verifică semnătura cu cheia publică din certificatul atașat. Pentru a împiedica urmărirea fizică (dacă un vehicul ar folosi mereu același certificat, ar putea fi monitorizat continuu), fiecare mașină primește ~20 de pseudonyme — certificate de scurtă durată, rotite la câteva minute. Este o problemă greu de rezolvat: balansul dintre anonimitate (pseudonime multiple) și acountabilitate (posibilitatea de a revoca un vehicul care se comportă rău). User/parolă sau MAC filtering nu funcționează la milioane de vehicule mobile.',
      },
      {
        q: 'Ce este un atac „ghost vehicle” în contextul V2X?',
        answer: 'Injectarea de poziții false ale vehiculelor în rețea',
        explain:
          'Un atacator creează BSM-uri pentru o mașină inexistentă, care apare „brusc” în trafic lângă vehicule reale. Mașinile autonome care depind de V2X pentru deciziile lor pot reacționa cu frânare de urgență (cauzând coliziuni în lanț cu mașinile reale din spate), sau pot vira pentru a evita un obstacol care nu există. Acest tip de atac poate fi folosit ofensiv (carjacking — opresc o mașină autonomă într-o zonă controlată) sau ca sabotaj urban (paralizarea unui întreg cartier). Furtul de date sau hackuirea de la distanță sunt clase diferite, iar blocarea GPS-ului este alt tip de atac (jamming).',
      },
    ],
  },
  // ─────────────── MISIUNEA 5 — ECU FIRMWARE ───────────────
  {
    missionId: 'ecu_firmware',
    intro:
      'Firmware-ul ECU este software-ul de nivel scăzut care controlează direct hardware-ul. Spre deosebire de aplicațiile pe smartphone, ECU-urile rulează adesea bare-metal (fără sistem de operare) sau cu un RTOS minimal precum AUTOSAR sau FreeRTOS. O modificare ostilă oferă atacatorului control total al funcției respective. Producătorii livrează update-uri prin OTA (Over-The-Air) — un mecanism care, dacă nu e securizat criptografic, devine autostradă pentru malware la scară globală.',
    questions: [
      {
        q: 'Care este vulnerabilitatea principală în actualizările OTA ale firmware-ului ECU?',
        answer: 'Lipsa verificării semnăturii digitale',
        explain:
          'Dacă un ECU acceptă orice fișier firmware fără a verifica că provine de la producător (semnătură digitală generată cu cheia privată a acestuia), atacatorul poate distribui firmware modificat printr-un MITM pe rețeaua mobilă sau prin compromiterea serverelor de update. Cercetătorii Charlie Miller și Chris Valasek au demonstrat în 2015 acest lanț de atac pe Jeep Cherokee (rezultând în recall-ul a 1.4 milioane de vehicule). Dimensiunea fișierului, viteza conexiunii sau formatul nu sunt probleme de securitate — sunt probleme de operațiune normală.',
      },
      {
        q: 'Ce tehnică este folosită pentru a extrage firmware dintr-un ECU?',
        answer: 'Exploatarea interfeței JTAG/SWD',
        explain:
          'JTAG (Joint Test Action Group) și SWD (Serial Wire Debug) sunt interfețe hardware standardizate de debugging — permit citirea memoriei flash și RAM cip-cu-cip. Producătorii ar trebui să le dezactiveze permanent înainte de livrare (prin „blowing fuses” sau lock bits), dar adesea le lasă active pentru reparații sau le protejează slab. Un cercetător cu un Black Magic Probe (40 €) sau J-Link (120-200 €) poate dumpa firmware-ul în câteva minute. USB-ul, Bluetooth-ul și Wi-Fi-ul nu oferă acces direct la memorie — doar la API-urile expuse de software.',
      },
      {
        q: 'Ce previne „Secure Boot” în contextul ECU-urilor?',
        answer: 'Rularea firmware-ului neautorizat sau modificat',
        explain:
          'Secure Boot verifică criptografic FIECARE etapă a încărcării: boot ROM-ul (read-only, ars în siliciu) verifică bootloader-ul, care verifică firmware-ul principal, care eventual verifică modulele dinamice. Fiecare semnătură trebuie să fie validă cu cheile publice arse în hardware (eFuses). Dacă o singură verificare eșuează, ECU-ul refuză să pornească sau intră în „limp mode”. Aceasta blochează firmware modificat, dar NU protejează împotriva furtului fizic, atacurilor de epuizare a bateriei sau GPS spoofing — acestea sunt clase diferite de atac.',
      },
      {
        q: 'Ce tip de vulnerabilitate permite atacatorilor să suprascrie memoria ECU-ului?',
        answer: 'Buffer Overflow',
        explain:
          'Codul C nesecurizat care nu validează lungimea input-ului (de exemplu `strcpy()`, `memcpy()` cu dimensiuni controlate de atacator, `gets()`) permite scrierea în afara buffer-ului alocat. În ECU-uri (microcontrolere ARM Cortex-M, PowerPC, V850 Renesas) lipsesc adesea protecțiile moderne ale PC-urilor: nu există ASLR (Address Space Layout Randomization), DEP/NX (Data Execution Prevention) este parțial, stack canaries sunt rare. Asta face exploit-urile mult mai simple decât pe desktop. XSS, LDAP Injection și XXE sunt vulnerabilități specifice aplicațiilor web — n-au nicio legătură cu firmware-ul embedded.',
      },
      {
        q: 'Care este scopul unui Hardware Security Module (HSM) în ECU-urile moderne?',
        answer: 'Stocarea securizată a cheilor criptografice',
        explain:
          'HSM (Hardware Security Module) — sau varianta auto mai mică, SHE (Secure Hardware Extension) — este un coprocesor izolat în interiorul ECU-ului care stochează cheile criptografice și execută operațiile cripto fără ca cheile să atingă vreodată memoria principală. Chiar dacă firmware-ul ECU-ului este complet compromis (atacatorul are control software total), nu poate extrage cheile — le poate folosi DOAR prin API-ul HSM, care impune politici stricte. Standardele EVITA (Light/Medium/Full) și AUTOSAR specifică nivelurile cerute pe tip de ECU. HSM-urile nu cresc viteza de procesare generală, nu gestionează Bluetooth-ul și nu au treabă cu consumul de combustibil.',
      },
    ],
  },
];

const DOC_TOPICS = MISSIONS.map(m => ({
  id: m.id,
  number: m.number,
  title: m.title,
  subtitle: m.subtitle,
  color: m.difficultyColor,
}));

export default function DocsScreen() {
  const router = useRouter();
  const fadeIn = useRef(new Animated.Value(0)).current;
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  useEffect(() => {
    Animated.timing(fadeIn, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  const toggle = (idx: number) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const expandAll = () => setExpanded(new Set(DOC_TOPICS.map((_, i) => i)));
  const collapseAll = () => setExpanded(new Set());

  return (
    <Animated.View style={[styles.root, { opacity: fadeIn }]}>
      <LinearGradient colors={['#000000', '#000a1e', '#000510']} style={StyleSheet.absoluteFill} />

      {/* Scanlines */}
      <View style={styles.scanlines} pointerEvents="none">
        {Array.from({ length: 30 }).map((_, i) => (
          <View key={i} style={[styles.scanline, { top: (i / 30) * height }]} />
        ))}
      </View>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>◂ BACK</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>◈ DOCUMENTATION ◈</Text>
          <Text style={styles.headerSub}>AUTOMOTIVE CYBERSECURITY</Text>
        </View>
        <View style={{ width: 70 }} />
      </View>

      <View style={styles.dividerLine} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Intro */}
        <View style={styles.introBox}>
          <Text style={styles.introTitle}>◈ BINE AI VENIT ÎN BIBLIOTECA DE SECURITATE ◈</Text>
          <Text style={styles.introText}>
            Această secțiune conține materialele de studiu pentru toate misiunile din simulatorul CYBER RIDE.
            Pentru fiecare misiune sunt explicate în detaliu cele 5 întrebări din quiz — răspunsul corect,
            motivul pentru care este corect și contextul real în care apare conceptul. Citește înainte de
            misiune pentru a maximiza scorul.
          </Text>
        </View>

        {/* Expand/Collapse controls */}
        <View style={styles.controlsRow}>
          <TouchableOpacity style={styles.controlBtn} onPress={expandAll} activeOpacity={0.7}>
            <Text style={styles.controlText}>▼ EXPAND ALL</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlBtn} onPress={collapseAll} activeOpacity={0.7}>
            <Text style={styles.controlText}>▶ COLLAPSE ALL</Text>
          </TouchableOpacity>
        </View>

        {/* Topic sections */}
        {DOC_TOPICS.map((topic, i) => {
          const content = DOC_CONTENT.find(c => c.missionId === topic.id);
          const isOpen = expanded.has(i);
          return (
            <View key={i} style={styles.topicCard}>
              <TouchableOpacity
                style={[styles.topicHeader, isOpen && styles.topicHeaderOpen]}
                onPress={() => toggle(i)}
                activeOpacity={0.7}
              >
                <View style={[styles.topicNumBadge, { borderColor: topic.color }]}>
                  <Text style={[styles.topicNum, { color: topic.color }]}>
                    {String(topic.number).padStart(2, '0')}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.topicTitle}>{topic.title}</Text>
                  <Text style={styles.topicSubtitle}>{topic.subtitle}</Text>
                </View>
                <Text style={[styles.chevron, { color: topic.color }]}>
                  {isOpen ? '▼' : '▶'}
                </Text>
              </TouchableOpacity>

              {isOpen && content ? (
                <View style={styles.contentBody}>
                  {/* Mission intro */}
                  <View style={styles.missionIntroBox}>
                    <Text style={styles.missionIntroLabel}>▸ CONTEXT</Text>
                    <Text style={styles.missionIntroText}>{content.intro}</Text>
                  </View>

                  {/* Questions */}
                  {content.questions.map((q, qi) => (
                    <View key={qi} style={styles.questionBlock}>
                      <Text style={styles.qLabel}>ÎNTREBARE {String(qi + 1).padStart(2, '0')}</Text>
                      <Text style={styles.qText}>{q.q}</Text>

                      <View style={styles.answerRow}>
                        <Text style={styles.answerLabel}>RĂSPUNS CORECT</Text>
                        <Text style={[styles.answerValue, { color: topic.color }]}>{q.answer}</Text>
                      </View>

                      <View style={styles.explainBox}>
                        <Text style={styles.explainLabel}>▸ EXPLICAȚIE</Text>
                        <Text style={styles.explainText}>{q.explain}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              ) : isOpen ? (
                <View style={styles.comingSoon}>
                  <Text style={styles.comingSoonIcon}>⏳</Text>
                  <Text style={styles.comingSoonText}>DOCUMENTAȚIE ÎN PREGĂTIRE</Text>
                </View>
              ) : null}
            </View>
          );
        })}

        <View style={{ height: 50 }} />
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  scanlines: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' },
  scanline: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: 'rgba(0,0,0,0.12)' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 52,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  backBtn: { width: 70, paddingVertical: 6 },
  backText: { fontFamily: MONOSPACE, fontSize: 12, color: 'rgba(0,229,255,0.6)', letterSpacing: 2 },
  headerCenter: { alignItems: 'center' },
  headerTitle: {
    fontFamily: MONOSPACE,
    fontSize: 13,
    fontWeight: '900',
    color: '#00e5ff',
    letterSpacing: 3,
    textShadowColor: '#00e5ff',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  headerSub: { fontFamily: MONOSPACE, fontSize: 8, color: 'rgba(0,229,255,0.4)', letterSpacing: 2, marginTop: 3 },
  dividerLine: { height: 1, backgroundColor: 'rgba(0,229,255,0.2)', marginHorizontal: 20, marginBottom: 8 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 12 },
  introBox: {
    borderWidth: 1,
    borderColor: 'rgba(0,229,255,0.25)',
    backgroundColor: 'rgba(0,10,30,0.7)',
    padding: 16,
    marginBottom: 16,
  },
  introTitle: {
    fontFamily: MONOSPACE,
    fontSize: 9,
    color: 'rgba(0,229,255,0.55)',
    letterSpacing: 2,
    marginBottom: 10,
    textAlign: 'center',
  },
  introText: {
    fontFamily: MONOSPACE,
    fontSize: 11,
    color: 'rgba(255,255,255,0.65)',
    lineHeight: 18,
    letterSpacing: 0.3,
  },
  topicCard: {
    borderWidth: 1,
    borderColor: 'rgba(0,229,255,0.2)',
    backgroundColor: 'rgba(0,10,30,0.6)',
    marginBottom: 14,
    overflow: 'hidden',
  },
  topicHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
  },
  topicHeaderOpen: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,229,255,0.18)',
    backgroundColor: 'rgba(0,229,255,0.04)',
  },
  chevron: {
    fontSize: 12,
    fontFamily: MONOSPACE,
    paddingHorizontal: 6,
  },
  controlsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  controlBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(0,229,255,0.25)',
    backgroundColor: 'rgba(0,229,255,0.05)',
    paddingVertical: 9,
    alignItems: 'center',
  },
  controlText: {
    fontFamily: MONOSPACE,
    fontSize: 9,
    color: 'rgba(0,229,255,0.75)',
    letterSpacing: 2,
  },
  topicNumBadge: {
    width: 38,
    height: 38,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  topicNum: { fontFamily: MONOSPACE, fontSize: 16, fontWeight: '900' },
  topicTitle: { fontFamily: MONOSPACE, fontSize: 11, fontWeight: '900', color: '#00e5ff', letterSpacing: 1 },
  topicSubtitle: { fontFamily: MONOSPACE, fontSize: 9, color: 'rgba(0,229,255,0.45)', letterSpacing: 1, marginTop: 2 },

  // Content
  contentBody: {
    padding: 14,
  },
  missionIntroBox: {
    borderLeftWidth: 2,
    borderLeftColor: 'rgba(0,229,255,0.5)',
    backgroundColor: 'rgba(0,30,60,0.35)',
    padding: 12,
    marginBottom: 14,
  },
  missionIntroLabel: {
    fontFamily: MONOSPACE,
    fontSize: 8,
    color: 'rgba(0,229,255,0.7)',
    letterSpacing: 2,
    marginBottom: 6,
  },
  missionIntroText: {
    fontFamily: MONOSPACE,
    fontSize: 11,
    color: 'rgba(220,235,255,0.78)',
    lineHeight: 17,
    letterSpacing: 0.2,
  },
  questionBlock: {
    borderWidth: 1,
    borderColor: 'rgba(0,229,255,0.10)',
    backgroundColor: 'rgba(0,8,22,0.55)',
    padding: 11,
    marginBottom: 10,
  },
  qLabel: {
    fontFamily: MONOSPACE,
    fontSize: 8,
    color: 'rgba(0,229,255,0.50)',
    letterSpacing: 2,
    marginBottom: 6,
  },
  qText: {
    fontFamily: MONOSPACE,
    fontSize: 11,
    color: '#ffffff',
    lineHeight: 16,
    marginBottom: 9,
    letterSpacing: 0.2,
  },
  answerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 9,
    paddingVertical: 5,
    paddingHorizontal: 7,
    backgroundColor: 'rgba(0,229,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(0,229,255,0.18)',
    flexWrap: 'wrap',
  },
  answerLabel: {
    fontFamily: MONOSPACE,
    fontSize: 8,
    color: 'rgba(0,229,255,0.55)',
    letterSpacing: 1.5,
  },
  answerValue: {
    flex: 1,
    fontFamily: MONOSPACE,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  explainBox: {
    paddingTop: 4,
  },
  explainLabel: {
    fontFamily: MONOSPACE,
    fontSize: 8,
    color: 'rgba(0,229,255,0.50)',
    letterSpacing: 2,
    marginBottom: 5,
  },
  explainText: {
    fontFamily: MONOSPACE,
    fontSize: 10,
    color: 'rgba(255,255,255,0.65)',
    lineHeight: 16,
    letterSpacing: 0.2,
  },

  comingSoon: {
    padding: 20,
    alignItems: 'center',
    gap: 6,
  },
  comingSoonIcon: { fontSize: 22 },
  comingSoonText: {
    fontFamily: MONOSPACE,
    fontSize: 10,
    color: 'rgba(0,229,255,0.45)',
    letterSpacing: 2,
  },
});
