/**
 * @file Default platform avatars available for all sender profiles and users.
 */

export const AVATAR_CATEGORIES = Object.freeze([
  {
    id: 'realistic',
    name: 'Default Realistic Avatars',
    description: 'Executive studio portraits with consistent lighting.',
    avatars: [
      { id: 'avatar_1', label: 'Tech Executive (Navy Suit)', path: '../../assets/avatars/avatar_1.jpg' },
      { id: 'avatar_2', label: 'Managing Director (Charcoal Blazer)', path: '../../assets/avatars/avatar_2.jpg' },
      { id: 'avatar_3', label: 'Founder & Tech Lead (Glasses)', path: '../../assets/avatars/avatar_3.jpg' },
      { id: 'avatar_4', label: 'Growth & Strategy Lead (Sage Blazer)', path: '../../assets/avatars/avatar_4.jpg' },
      { id: 'avatar_5', label: 'Senior Partner (Executive Suit)', path: '../../assets/avatars/avatar_5.jpg' },
      { id: 'avatar_6', label: 'VP of Product (Cream Blazer)', path: '../../assets/avatars/avatar_6.jpg' },
    ],
  },
  {
    id: 'artistic',
    name: 'Artistic Avatars',
    description: 'Stylized collectible character avatars with tech personas.',
    avatars: [
      { id: 'artistic_1', label: 'Cyber Visionary', path: '../../assets/avatars/artistic_1.svg' },
      { id: 'artistic_2', label: 'Studio Creator', path: '../../assets/avatars/artistic_2.svg' },
      { id: 'artistic_3', label: 'VR Architect', path: '../../assets/avatars/artistic_3.svg' },
      { id: 'artistic_4', label: 'Crypto Nomad', path: '../../assets/avatars/artistic_4.svg' },
      { id: 'artistic_5', label: 'Cosmic Voyager', path: '../../assets/avatars/artistic_5.svg' },
      { id: 'artistic_6', label: 'Code Maverick', path: '../../assets/avatars/artistic_6.svg' },
    ],
  },
]);

export const DEFAULT_AVATARS = Object.freeze([
  ...AVATAR_CATEGORIES[0].avatars,
  ...AVATAR_CATEGORIES[1].avatars,
]);


