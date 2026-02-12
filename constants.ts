
import { Category, SubCategory, Lyric } from './types';

export const COLORS = {
  CREAM: '#F5F5DC',
  BROWN: '#5D4037',
  GREEN: '#2E7D32',
  RED: '#C62828',
};

export const INITIAL_CATEGORIES: Category[] = [
  { id: '1', name: 'حمد باری تعالٰی', serial: 1 },
  { id: '2', name: 'نعت رسول مقبول ﷺ', serial: 2 },
  { id: '3', name: 'منقبتِ اہل بیت', serial: 3 },
  { id: '4', name: 'منقبتِ اولیاء', serial: 4 },
  { id: '5', name: 'سلام و درود', serial: 5 },
  { id: '6', name: 'قطعات و رباعیات', serial: 6 },
];

export const INITIAL_SUBCATEGORIES: SubCategory[] = [
  // 1: Hamd (5 Sub-cats)
  { id: 's1', categoryId: '1', name: 'اردو حمد', serial: 1 },
  { id: 's2', categoryId: '1', name: 'مناجات', serial: 2 },
  { id: 's3', categoryId: '1', name: 'حمدِ باری', serial: 3 },
  { id: 's19', categoryId: '1', name: 'ثنائے الہی', serial: 4 },
  { id: 's20', categoryId: '1', name: 'شکرِ خدا', serial: 5 },
  
  // 2: Naat (5 Sub-cats)
  { id: 's4', categoryId: '2', name: 'اردو نعت', serial: 1 },
  { id: 's5', categoryId: '2', name: 'عربی نعت', serial: 2 },
  { id: 's6', categoryId: '2', name: 'فارسی نعت', serial: 3 },
  { id: 's21', categoryId: '2', name: 'نعتِ پاک (مشہور)', serial: 4 },
  { id: 's22', categoryId: '2', name: 'میلاد النبیؐ', serial: 5 },

  // 3: Ahle Bait (5 Sub-cats)
  { id: 's7', categoryId: '3', name: 'شانِ علیؓ', serial: 1 },
  { id: 's8', categoryId: '3', name: 'شانِ حسینؓ', serial: 2 },
  { id: 's9', categoryId: '3', name: 'شانِ پنجتن پاک', serial: 3 },
  { id: 's23', categoryId: '3', name: 'شانِ زہرا سلام اللہ', serial: 4 },
  { id: 's24', categoryId: '3', name: 'شانِ حسنین کریمین', serial: 5 },

  // 4: Awliya (5 Sub-cats)
  { id: 's10', categoryId: '4', name: 'غوثِ اعظم', serial: 1 },
  { id: 's11', categoryId: '4', name: 'خواجہ غریب نواز', serial: 2 },
  { id: 's12', categoryId: '4', name: 'داتا گنج بخش', serial: 3 },
  { id: 's25', categoryId: '4', name: 'حضرت بلھے شاہ', serial: 4 },
  { id: 's26', categoryId: '4', name: 'وارث شاہ', serial: 5 },

  // 5: Salam (5 Sub-cats)
  { id: 's13', categoryId: '5', name: 'درود و سلام', serial: 1 },
  { id: 's14', categoryId: '5', name: 'مستجاب سلام', serial: 2 },
  { id: 's15', categoryId: '5', name: 'سلامِ رضا', serial: 3 },
  { id: 's27', categoryId: '5', name: 'سلام بر مصطفیٰؐ', serial: 4 },
  { id: 's28', categoryId: '5', name: 'صوفیانہ کلام', serial: 5 },

  // 6: Qataat (5 Sub-cats)
  { id: 's16', categoryId: '6', name: 'اخلاقی قطعات', serial: 1 },
  { id: 's17', categoryId: '6', name: 'صوفیانہ رباعیات', serial: 2 },
  { id: 's18', categoryId: '6', name: 'متفرق اشعار', serial: 3 },
  { id: 's29', categoryId: '6', name: 'حکمت و دانائی', serial: 4 },
  { id: 's30', categoryId: '6', name: 'عشقِ حقیقی', serial: 5 },
];

const generateLyrics = (): Lyric[] => {
  const lyrics: Lyric[] = [];
  
  INITIAL_SUBCATEGORIES.forEach(sub => {
    for (let i = 1; i <= 10; i++) {
      const isFirst = i === 1;
      lyrics.push({
        id: `l-${sub.id}-${i}`,
        subCategoryId: sub.id,
        serial: i,
        title: `${sub.name} - کلام ${i}`,
        content: `بند اول:\nتیری قدرت کے نظارے ہیں زمانے بھر میں\nتیری رحمت کے سہارے ہیں زمانے بھر میں\n\nبند دوم:\nکوئی تجھ سا نہیں اے مالکِ ارض و سما\nتیرے قبضے میں ہے ہر ذرہ و ہر ایک فضا\n\nبند سوم:\nتیرے در کا میں گدا ہوں مری بگڑی بنا دے تو\nاپنے فضل و کرم سے میرا دامن بھر دے تو\n\nبند چہارم:\nصبح اٹھ کر تیرا ہی نام لبوں پر آئے\nشام ڈھلے بھی تری یاد ہی دل کو بھائے\n\nبند پنجم:\nذکر سے تیرے ہی ملتی ہے سکونِِ قلب کو راحت\nتیری ہی بندگی ہے مومن کی اصل سعادت\n\nبند ششم:\nمجھ گنہگار کو بھی اپنا بنا لے میرے مولیٰ\nخواب میں اپنا بھی جلوہ تو دکھا دے میرے مولیٰ`,
        // Assign sample audio to the first 2 lyrics of each sub-category for testing
        audioUrl: i <= 2 ? 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' : undefined
      });
    }
  });

  return lyrics;
};

export const INITIAL_LYRICS: Lyric[] = generateLyrics();
