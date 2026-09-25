/*
 * ESP32 LoRa Sender — SX1278 via PlatformIO
 *
 * Wiring (SPI):
 *   LoRa NSS   -> GPIO5
 *   LoRa SCK   -> GPIO18
 *   LoRa MOSI  -> GPIO23
 *   LoRa MISO  -> GPIO19
 *   LoRa RESET -> GPIO14
 *   LoRa DIO0  -> GPIO26
 *   LoRa VCC   -> 3.3V (JANGAN 5V!)
 *   LoRa GND   -> GND
 *
 * Library: LoRa by Sandeep Mistry
 * Gateway frequency: 433 MHz (Indonesia ISM band)
 */

#include <Arduino.h>
#include <SPI.h>
#include <LoRa.h>

#define LORA_SS     5
#define LORA_RST    14
#define LORA_DIO0   26
#define LORA_FREQ   433E6
#define LORA_SF     7
#define LORA_BW     125E3
#define LORA_CR     5

#define LED_PIN     2

unsigned long packetCount = 0;

void setup() {
  Serial.begin(115200);
  delay(100);
  Serial.println(F("\n=== ESP32 LoRa Sender ==="));

  pinMode(LED_PIN, OUTPUT);

  LoRa.setPins(LORA_SS, LORA_RST, LORA_DIO0);
  if (!LoRa.begin(LORA_FREQ)) {
    Serial.println(F("LoRa init FAILED. Check wiring!"));
    while (1);
  }

  LoRa.setSpreadingFactor(LORA_SF);
  LoRa.setSignalBandwidth(LORA_BW);
  LoRa.setCodingRate4(LORA_CR);
  LoRa.setTxPower(17);

  Serial.println(F("LoRa OK. Sending packets...\n"));
}

void loop() {
  float temperature = 25.5 + random(-10, 10) * 0.1;
  float humidity    = 60.0 + random(-20, 20) * 0.1;
  int   battery     = random(60, 100);

  String packet = String(packetCount) + "," +
                  String(temperature, 1) + "," +
                  String(humidity, 1) + "," +
                  String(battery);

  LoRa.beginPacket();
  LoRa.print(packet);
  LoRa.endPacket();

  packetCount++;

  Serial.print(F("Sent [#"));
  Serial.print(packetCount);
  Serial.print(F("]: "));
  Serial.println(packet);

  digitalWrite(LED_PIN, HIGH);
  delay(100);
  digitalWrite(LED_PIN, LOW);

  delay(1800);
}