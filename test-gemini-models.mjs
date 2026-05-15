const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models?key=AIzaSyCWCN_KFqZBXPR4Wybw-qBRC8Jk7Trv6B8');
const data = await response.json();
console.log(data.models.map(m => m.name).join('\n'));
