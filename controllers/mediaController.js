const { db } = require('../config/database');

const BIBLE_NAMES = ['DavidFaith','PaulGrace','EstherHope','RuthLight','MaryBlessed',
  'JohnPeace','LukeMercy','PeterRock','TimothyServe','AbrahamTrust',
  'SarahPraise','JosephDream','DeborahBrave','NaomiKind','MaryJoy'];

exports.randomName = (req, res) => {
  res.json({ name: BIBLE_NAMES[Math.floor(Math.random()*BIBLE_NAMES.length)] + Math.floor(Math.random()*999) });
};

exports.getPosts = (req, res) => {
  const posts = db.posts.active().map(p => ({
    ...p,
    active:         1,
    is_pinned:      p.pinned === 1,
    is_weekly_word: p.type === 'ww',
    category:       p.type || 'photo',
    author_color:   '#4B0082',
    user_name:      p.author,
  }));
  res.json(posts);
};

exports.createPost = (req, res) => {
  const { caption, author, category, isPinned, isWeeklyWord, expireDays, type, pinned } = req.body;
  if (!caption) return res.status(400).json({ error: 'Caption required' });
  const imagePath = req.file ? `/uploads/gallery/${req.file.filename}` : null;
  const post = db.posts.insert({
    caption,
    image_path: imagePath,
    type:       isWeeklyWord === '1' ? 'ww' : (category || type || 'photo'),
    pinned:     (isPinned === '1' || pinned === '1' || pinned === 1) ? 1 : 0,
    author:     author || req.admin?.display_name || 'Admin',
    expireDays: parseInt(expireDays) || 7,
  });
  res.json({ success: true, post });
};

exports.deletePost    = (req, res) => { db.posts.delete(req.params.id); res.json({ success: true }); };
exports.togglePost    = (req, res) => {
  const { active, caption, author, type, pinned } = req.body;
  const update = {};
  if (caption !== undefined) update.caption = caption;
  if (author  !== undefined) update.author  = author;
  if (type    !== undefined) update.type    = type;
  if (pinned  !== undefined) update.pinned  = pinned;
  if (Object.keys(update).length) {
    db.posts.update(req.params.id, update);
  }
  res.json({ success: true });
};

exports.likePost = (req, res) => {
  const token = req.body.token || req.ip;
  const result = db.likes.toggle(req.params.post_id, token);
  res.json({ success: true, ...result, count: db.likes.count(req.params.post_id) });
};

exports.getComments = (req, res) => {
  const comments = db.comments.forPost(req.params.post_id).map(c => ({
    ...c,
    user_name: c.author,
    text:      c.content,
  }));
  res.json(comments);
};

exports.addComment = (req, res) => {
  const { author, content, user_name, text } = req.body;
  const body = content || text;
  if (!body?.trim()) return res.status(400).json({ error: 'Comment cannot be empty' });
  const comment = db.comments.insert(req.params.post_id, author || user_name || 'Anonymous', body.trim());
  res.json({ success: true, comment });
};

exports.deleteComment = (req, res) => { db.comments.delete(req.params.id); res.json({ success: true }); };
exports.purgeExpired  = () => db.posts.purgeExpired();
