import { describe, it, expect } from 'vitest';
import { checkInput, validateOutput, validateChatOutput, extractNumbers } from '@/services/llm/guard';
import stringsEn from '@/data/strings.en.json';
import stringsHi from '@/data/strings.hi.json';

describe('Safety Guard Unit Tests (src/services/llm/guard.ts)', () => {
  describe('checkInput: Emergency Red-Flag Interception', () => {
    it('detects acute respiratory distress in English ("can\'t breathe")', () => {
      const res = checkInput("My father can't breathe properly", 'en');
      expect(res.emergency).toBe(true);
      expect(res.message).toBe(stringsEn.emergency.careLine);
    });

    it('detects chest pain in English', () => {
      const res = checkInput('I feel severe tightness in chest and chest pain', 'en');
      expect(res.emergency).toBe(true);
      expect(res.message).toBe(stringsEn.emergency.careLine);
    });

    it('detects fainting in English', () => {
      const res = checkInput('My mother fainted and passed out from the smog', 'en');
      expect(res.emergency).toBe(true);
      expect(res.message).toBe(stringsEn.emergency.careLine);
    });

    it('detects acute respiratory distress in Hindi', () => {
      const res = checkInput('मेरे पिताजी को सांस लेने में बहुत तकलीफ हो रही है', 'hi');
      expect(res.emergency).toBe(true);
      expect(res.message).toBe(stringsHi.emergency.careLine);
    });

    it('detects chest pain in Hindi', () => {
      const res = checkInput('सीने में बहुत तेज दर्द है', 'hi');
      expect(res.emergency).toBe(true);
      expect(res.message).toBe(stringsHi.emergency.careLine);
    });

    it('passes normal inquiries without emergency flag', () => {
      const res = checkInput('What is the AQI forecast for tomorrow afternoon?', 'en');
      expect(res.emergency).toBe(false);
      expect(res.message).toBeUndefined();
    });
  });

  describe('validateOutput: Number Grounding & Banned Patterns', () => {
    it('rejects hallucinated numbers not in facts (e.g. invented AQI 72)', () => {
      const facts = { air: { aqi: 340, pm25: 190, pm10: 310 } };
      const output = 'Current AQI is 72, which is good.';
      const res = validateOutput(output, facts);
      expect(res.valid).toBe(false);
      expect(res.pass).toBe(false);
      expect(res.error).toContain('Unallowed number: 72');
    });

    it('accepts numbers present in facts or standard small integers', () => {
      const facts = { air: { aqi: 340, pm25: 190, pm10: 310 }, deltaPct: 24 };
      const output = 'Air AQI is 340 with PM2.5 at 190. Action reduces exposure by 24% over 24 hours.';
      const res = validateOutput(output, facts);
      expect(res.valid).toBe(true);
    });

    it('rejects medication dosing advice ("salbutamol", "2 puffs")', () => {
      const facts = { air: { aqi: 150 } };
      const output = 'Take 2 puffs of salbutamol inhaler for symptoms.';
      const res = validateOutput(output, facts);
      expect(res.valid).toBe(false);
      expect(res.error).toMatch(/Banned pattern/i);
    });

    it('rejects cure and illness prevention claims', () => {
      const facts = { air: { aqi: 150 } };
      const output = 'This herbal mixture will cure and prevent disease.';
      const res = validateOutput(output, facts);
      expect(res.valid).toBe(false);
      expect(res.error).toMatch(/Banned pattern/i);
    });

    it('rejects absolute guarantees ("will protect", "100% safe")', () => {
      const facts = { air: { aqi: 150 } };
      const output = 'This mask is 100% safe and will protect completely.';
      const res = validateOutput(output, facts);
      expect(res.valid).toBe(false);
      expect(res.error).toMatch(/Banned pattern/i);
    });

    it('rejects script tags and URLs', () => {
      const facts = { air: { aqi: 150 } };
      const output = 'Visit https://example.com or run <script>alert(1)</script>';
      const res = validateOutput(output, facts);
      expect(res.valid).toBe(false);
      expect(res.error).toMatch(/Banned pattern/i);
    });

    it('flags action ID mismatch when action IDs are missing or added', () => {
      const facts = {
        blocks: [{ id: 'b1', actions: [{ id: 'action-one' }, { id: 'action-two' }] }],
      };
      const output = {
        headline: 'Safe Plan',
        summary: 'Overview',
        blocks: [{ id: 'b1', intro: 'Intro' }],
        actions: [{ id: 'action-one', tip: 'Tip', whyPlain: 'Why' }],
        watchouts: [],
      };
      const res = validateOutput(output, facts);
      expect(res.valid).toBe(false);
      expect(res.violations).toContain('Action IDs in narration do not match planned actions');
    });
  });

  describe('validateChatOutput: Text Sanitization', () => {
    it('strips script tags and executable markup', () => {
      const dirty = 'Hello <script>alert("xss")</script> world!';
      const res = validateChatOutput(dirty);
      expect(res.sanitized).toBe('Hello  world!');
      expect(res.sanitized).not.toContain('<script>');
    });

    it('softens guarantees ("will protect" -> "can help lower")', () => {
      const text = 'Running a purifier will protect your family.';
      const res = validateChatOutput(text);
      expect(res.sanitized).toContain('can help lower');
      expect(res.sanitized).not.toContain('will protect');
    });

    it('extracts numbers accurately from prose', () => {
      const nums = extractNumbers('AQI is 342, PM2.5 is 185.5 and temp is 18 C');
      expect(nums).toEqual([342, 185.5, 18]);
    });
  });
});
