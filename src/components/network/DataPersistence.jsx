// Sistema de persistência de dados temporários
export const saveTemporaryData = (key, data) => {
  try {
    const timestamp = Date.now();
    const dataWithTimestamp = { data, timestamp };
    localStorage.setItem(`medprime_temp_${key}`, JSON.stringify(dataWithTimestamp));
    console.log(`Dados temporários salvos: ${key}`);
  } catch (error) {
    console.error('Erro ao salvar dados temporários:', error);
  }
};

export const getTemporaryData = (key, maxAge = 30 * 60 * 1000) => { // 30 minutos
  try {
    const stored = localStorage.getItem(`medprime_temp_${key}`);
    if (!stored) return null;

    const { data, timestamp } = JSON.parse(stored);
    const now = Date.now();

    if (now - timestamp > maxAge) {
      localStorage.removeItem(`medprime_temp_${key}`);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Erro ao recuperar dados temporários:', error);
    return null;
  }
};

export const clearTemporaryData = (key) => {
  try {
    localStorage.removeItem(`medprime_temp_${key}`);
    console.log(`Dados temporários limpos: ${key}`);
  } catch (error) {
    console.error('Erro ao limpar dados temporários:', error);
  }
};

export const getAllTemporaryData = () => {
  const tempData = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('medprime_temp_')) {
        const shortKey = key.replace('medprime_temp_', '');
        tempData[shortKey] = getTemporaryData(shortKey);
      }
    }
  } catch (error) {
    console.error('Erro ao recuperar todos os dados temporários:', error);
  }
  return tempData;
};