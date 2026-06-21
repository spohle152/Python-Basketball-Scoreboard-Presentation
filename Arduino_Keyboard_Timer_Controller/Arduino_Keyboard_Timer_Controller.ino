#include "Keyboard.h"
bool timerOn = false;
byte onHistory = 0b11111111;
byte offHistory = 0b11111111;

void setup() {
  // put your setup code here, to run once:
  pinMode(9, INPUT_PULLUP);
  pinMode(4, INPUT_PULLUP);
}

void loop() {
  // put your main code here, to run repeatedly:
  onHistory = onHistory << 1;
  onHistory += digitalRead(9);
  offHistory = offHistory << 1;
  offHistory += digitalRead(4);
  if (onHistory == 0b10000000 && timerOn == false) {
    timerOn=true;
    Keyboard.press(KEY_LEFT_CTRL);
    Keyboard.press('1');
    delay(1);
    Keyboard.release(KEY_LEFT_CTRL);
    Keyboard.release('1');
  }
  if (offHistory == 0b10000000 && timerOn == true) {
    timerOn=false;
    Keyboard.press(KEY_LEFT_CTRL);
    Keyboard.press('2');
    delay(1);
    Keyboard.release(KEY_LEFT_CTRL);
    Keyboard.release('2');
  }
  delay(1);
}
