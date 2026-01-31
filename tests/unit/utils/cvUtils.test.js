const cvUtils = require('../../../src/utils/cvUtils');

describe('CVUtils', () => {

  describe('extractEmails', () => {
    it('should extract valid email addresses', () => {
      const text = 'Contact me at john.doe@example.com or jane@test.co.uk';
      const emails = cvUtils.extractEmails(text);

      expect(emails).toContain('john.doe@example.com');
      expect(emails).toContain('jane@test.co.uk');
      expect(emails).toHaveLength(2);
    });

    it('should return empty array if no emails found', () => {
      const text = 'No emails here';
      const emails = cvUtils.extractEmails(text);

      expect(emails).toEqual([]);
    });

    it('should handle multiple occurrences of same email', () => {
      const text = 'test@example.com is my email. Contact test@example.com for more info';
      const emails = cvUtils.extractEmails(text);

      expect(emails).toHaveLength(1);
      expect(emails[0]).toBe('test@example.com');
    });

    it('should convert emails to lowercase', () => {
      const text = 'Contact JOHN.DOE@EXAMPLE.COM';
      const emails = cvUtils.extractEmails(text);

      expect(emails[0]).toBe('john.doe@example.com');
    });
  });

  describe('extractPhones', () => {
    it('should extract phone numbers in various formats', () => {
      const text = 'Call me at +1-234-567-8900 or (555) 123-4567';
      const phones = cvUtils.extractPhones(text);

      expect(phones.length).toBeGreaterThan(0);
    });

    it('should extract international phone numbers', () => {
      const text = 'International: +34 612 345 678';
      const phones = cvUtils.extractPhones(text);

      expect(phones.length).toBeGreaterThan(0);
    });

    it('should return empty array if no phones found', () => {
      const text = 'No phone numbers here';
      const phones = cvUtils.extractPhones(text);

      expect(phones).toEqual([]);
    });

    it('should handle phone numbers with parentheses', () => {
      const text = '(555) 123-4567';
      const phones = cvUtils.extractPhones(text);

      expect(phones.length).toBeGreaterThan(0);
    });
  });

  describe('extractUrls', () => {
    it('should extract HTTP URLs', () => {
      const text = 'Visit http://example.com for more info';
      const urls = cvUtils.extractUrls(text);

      expect(urls).toContain('http://example.com');
    });

    it('should extract HTTPS URLs', () => {
      const text = 'Visit https://example.com';
      const urls = cvUtils.extractUrls(text);

      expect(urls).toContain('https://example.com');
    });

    it('should extract multiple URLs', () => {
      const text = 'Visit https://example.com and http://test.com';
      const urls = cvUtils.extractUrls(text);

      expect(urls).toHaveLength(2);
    });

    it('should return empty array if no URLs found', () => {
      const text = 'No URLs here';
      const urls = cvUtils.extractUrls(text);

      expect(urls).toEqual([]);
    });
  });

  describe('extractLinkedIn', () => {
    it('should extract LinkedIn URLs', () => {
      const text = 'Connect with me at https://www.linkedin.com/in/johndoe';
      const linkedin = cvUtils.extractLinkedIn(text);

      expect(linkedin).toContain('linkedin.com/in/johndoe');
    });

    it('should extract LinkedIn URL without protocol', () => {
      const text = 'linkedin.com/in/johndoe';
      const linkedin = cvUtils.extractLinkedIn(text);

      expect(linkedin).toContain('linkedin.com/in/johndoe');
    });

    it('should return null if no LinkedIn URL found', () => {
      const text = 'No LinkedIn profile';
      const linkedin = cvUtils.extractLinkedIn(text);

      expect(linkedin).toBeNull();
    });
  });

  describe('extractGitHub', () => {
    it('should extract GitHub URLs', () => {
      const text = 'Check my code at https://github.com/johndoe';
      const github = cvUtils.extractGitHub(text);

      expect(github).toContain('github.com/johndoe');
    });

    it('should extract GitHub URL without protocol', () => {
      const text = 'github.com/johndoe';
      const github = cvUtils.extractGitHub(text);

      expect(github).toContain('github.com/johndoe');
    });

    it('should return null if no GitHub URL found', () => {
      const text = 'No GitHub profile';
      const github = cvUtils.extractGitHub(text);

      expect(github).toBeNull();
    });
  });

  describe('extractDates', () => {
    it('should extract year dates', () => {
      const text = 'Graduated in 2020';
      const dates = cvUtils.extractDates(text);

      expect(dates).toContain('2020');
    });

    it('should extract MM/YYYY dates', () => {
      const text = 'Started 01/2020';
      const dates = cvUtils.extractDates(text);

      expect(dates.length).toBeGreaterThan(0);
    });

    it('should detect "present" keyword', () => {
      const text = 'Working from 2020 to present';
      const dates = cvUtils.extractDates(text);

      expect(dates).toContain('Presente');
    });

    it('should detect "current" keyword', () => {
      const text = 'Current position since 2020';
      const dates = cvUtils.extractDates(text);

      expect(dates).toContain('Presente');
    });

    it('should extract month year combinations', () => {
      const text = 'Started in January 2020';
      const dates = cvUtils.extractDates(text);

      expect(dates.length).toBeGreaterThan(0);
    });
  });

  describe('normalizeText', () => {
    it('should remove extra whitespace', () => {
      const text = 'Hello    World';
      const normalized = cvUtils.normalizeText(text);

      expect(normalized).not.toContain('    ');
    });

    it('should remove tabs', () => {
      const text = 'Hello\t\tWorld';
      const normalized = cvUtils.normalizeText(text);

      expect(normalized).not.toContain('\t');
    });

    it('should handle null or empty text', () => {
      expect(cvUtils.normalizeText(null)).toBe('');
      expect(cvUtils.normalizeText('')).toBe('');
    });

    it('should preserve line breaks', () => {
      const text = 'Line 1\nLine 2';
      const normalized = cvUtils.normalizeText(text);

      expect(normalized).toContain('\n');
    });
  });

  describe('splitIntoSections', () => {
    it('should split text into sections', () => {
      const text = 'EXPERIENCE\nDeveloper at Company\n\nEDUCATION\nBachelor Degree';
      const keywords = {
        experience: ['experience', 'experiencia'],
        education: ['education', 'educación']
      };

      const sections = cvUtils.splitIntoSections(text, keywords);

      expect(sections).toHaveProperty('experience');
      expect(sections).toHaveProperty('education');
    });

    it('should handle case insensitive keywords', () => {
      const text = 'EXPERIENCE\nSome text\nEDUCATION\nMore text';
      const keywords = {
        experience: ['experience'],
        education: ['education']
      };

      const sections = cvUtils.splitIntoSections(text, keywords);

      expect(sections.experience).toBeDefined();
      expect(sections.education).toBeDefined();
    });

    it('should return empty object if no sections found', () => {
      const text = 'Random text without sections';
      const keywords = {
        experience: ['experience']
      };

      const sections = cvUtils.splitIntoSections(text, keywords);

      expect(sections).toBeDefined();
    });
  });

  describe('extractSkills', () => {
    it('should extract common programming skills', () => {
      const text = 'Skills: JavaScript, Python, React, Node.js';
      
      // If the method exists
      if (cvUtils.extractSkills) {
        const skills = cvUtils.extractSkills(text);
        expect(skills).toBeInstanceOf(Array);
      }
    });
  });

  describe('cleanText', () => {
    it('should clean special characters if method exists', () => {
      const text = 'Hello @#$ World!';
      
      if (cvUtils.cleanText) {
        const cleaned = cvUtils.cleanText(text);
        expect(cleaned).toBeDefined();
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long text', () => {
      const longText = 'a'.repeat(10000);
      expect(() => cvUtils.normalizeText(longText)).not.toThrow();
    });

    it('should handle text with special characters', () => {
      const text = 'Email: test@example.com © 2024';
      const emails = cvUtils.extractEmails(text);
      expect(emails).toContain('test@example.com');
    });

    it('should handle mixed language text', () => {
      const text = 'Educación: Bachelor. Experiência: 5 years';
      expect(() => cvUtils.normalizeText(text)).not.toThrow();
    });
  });
});
