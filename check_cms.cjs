async function testCMS() {
  try {
    const res = await fetch('https://cms.aifynest.com/api/posts?where[status][equals]=published');
    if (res.ok) {
      const data = await res.json();
      console.log('CMS posts count:', data.docs?.length);
      console.log('CMS titles:', data.docs?.map(d => ({ title: d.title, slug: d.slug })));
    } else {
      console.log('CMS Status:', res.status);
    }
  } catch (e) {
    console.log('CMS Fetch Error:', e.message);
  }
}
testCMS();
