import axios from 'axios';

export async function getPendingList(data) {
  const result = await axios.post('/api/pending/list', {
    org_code: data,
  });
  return result.data;
}

export async function changeStatus(statusData) {
  const result = await axios.put('/api/pending/', {
    data: statusData,
  });
  return result.data;
}

export async function searchManagers(data) {
  const result = await axios.post('/api/pending/search/', {
    org_code: data,
  });
  return result.data;
}
