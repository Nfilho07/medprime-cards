/**
 * Generates dynamic achievements based on user level
 * This ensures there are always new achievements to unlock with unique titles
 */

export const generateDynamicAchievements = (userLevel) => {
  const dynamicAchievements = [];
  
  // Base achievements that always exist
  const baseAchievements = [
    {
      achievement_id: "first_card",
      title: "Primeiro Passo",
      description: "Criar seu primeiro flashcard",
      icon: "Plus",
      xp_reward: 50,
      condition_type: "cards_created",
      condition_value: 1
    },
    {
      achievement_id: "first_review",
      title: "Memória Ativa", 
      description: "Revisar seus primeiros 5 cards",
      icon: "History",
      xp_reward: 100,
      condition_type: "cards_reviewed", 
      condition_value: 5
    },
    {
      achievement_id: "first_session",
      title: "Rotina de Sucesso",
      description: "Completar sua primeira sessão de revisão",
      icon: "CalendarCheck",
      xp_reward: 150,
      condition_type: "sessions_completed",
      condition_value: 1
    }
  ];

  // Level-based achievements with unique titles
  const levelTitles = [
    { level: 5, title: "Explorador do Conhecimento", desc: "Descobrir novos horizontes acadêmicos" },
    { level: 10, title: "Guardião da Sabedoria", desc: "Proteger e cultivar o conhecimento médico" },
    { level: 15, title: "Navegador Neural", desc: "Dominar as conexões do aprendizado" },
    { level: 20, title: "Arquiteto Mental", desc: "Construir estruturas sólidas de conhecimento" },
    { level: 25, title: "Mestre da Disciplina", desc: "Alcançar consistência excepcional nos estudos" },
    { level: 30, title: "Lenda Acadêmica", desc: "Inspirar outros com sua dedicação" },
    { level: 35, title: "Titã do Saber", desc: "Atingir patamares épicos de conhecimento" },
    { level: 40, title: "Imperador dos Estudos", desc: "Reinar sobre vastos domínios do aprendizado" },
    { level: 45, title: "Cosmonauta Intelectual", desc: "Explorar galáxias de conhecimento" },
    { level: 50, title: "Divindade do Conhecimento", desc: "Transcender os limites do aprendizado humano" }
  ];

  levelTitles.forEach(({ level, title, desc }) => {
    if (level <= userLevel + 20) {
      dynamicAchievements.push({
        achievement_id: `level_${level}`,
        title: title,
        description: `${desc} - Nível ${level}`,
        icon: level <= 15 ? "Badge" : level <= 30 ? "Star" : level <= 45 ? "Medal" : "Crown",
        xp_reward: level * 100,
        condition_type: "user_level",
        condition_value: level
      });
    }
  });

  // Cards created achievements with creative titles
  const cardTitles = [
    { count: 10, title: "Sementes do Saber", desc: "Plantar as primeiras ideias", icon: "Sprout" },
    { count: 25, title: "Colecionador de Conceitos", desc: "Reunir pérolas de conhecimento", icon: "Package" },
    { count: 50, title: "Bibliotecário Digital", desc: "Organizar vastos arquivos mentais", icon: "Library" },
    { count: 100, title: "Curador de Conteúdo", desc: "Selecionar o melhor do conhecimento", icon: "Filter" },
    { count: 200, title: "Enciclopédico", desc: "Acumular sabedoria enciclopédica", icon: "BookOpen" },
    { count: 350, title: "Tesouro Intelectual", desc: "Guardar riquezas do conhecimento", icon: "Gem" },
    { count: 500, title: "Império do Aprendizado", desc: "Construir um império educacional", icon: "Castle" },
    { count: 750, title: "Oráculo Moderno", desc: "Possuir respostas para tudo", icon: "Eye" },
    { count: 1000, title: "Criador Imortal", desc: "Deixar um legado eterno de conhecimento", icon: "Infinity" },
    { count: 1500, title: "Deus da Criação", desc: "Moldar realidades através do conhecimento", icon: "Zap" }
  ];

  cardTitles.forEach(({ count, title, desc, icon }) => {
    if (count <= (userLevel * 75)) {
      dynamicAchievements.push({
        achievement_id: `cards_${count}`,
        title: title,
        description: `${desc} (${count} flashcards)`,
        icon: icon,
        xp_reward: count * 3,
        condition_type: "cards_created",
        condition_value: count
      });
    }
  });

  // Review achievements with unique themes
  const reviewTitles = [
    { count: 25, title: "Mente Despertada", desc: "Despertar o poder da repetição", icon: "Sunrise" },
    { count: 100, title: "Soldado da Memória", desc: "Lutar contra o esquecimento", icon: "Shield" },
    { count: 300, title: "Maratonista Mental", desc: "Correr longas distâncias cognitivas", icon: "Footprints" },
    { count: 500, title: "Alquimista Neural", desc: "Transformar informação em sabedoria", icon: "Beaker" },
    { count: 1000, title: "Imperador da Revisão", desc: "Comandar exércitos de memórias", icon: "Crown" },
    { count: 2000, title: "Mestre do Tempo", desc: "Dominar a dimensão temporal do aprendizado", icon: "Clock" },
    { count: 3500, title: "Guardião Eterno", desc: "Proteger conhecimentos por toda eternidade", icon: "Lock" },
    { count: 5000, title: "Consciência Infinita", desc: "Transcender os limites da mente humana", icon: "Brain" }
  ];

  reviewTitles.forEach(({ count, title, desc, icon }) => {
    if (count <= (userLevel * 150)) {
      dynamicAchievements.push({
        achievement_id: `review_${count}`,
        title: title,
        description: `${desc} (${count} revisões)`,
        icon: icon,
        xp_reward: count * 2,
        condition_type: "cards_reviewed",
        condition_value: count
      });
    }
  });

  // Session achievements with motivational themes
  const sessionTitles = [
    { count: 3, title: "Ritual Sagrado", desc: "Estabelecer o hábito divino", icon: "Flame" },
    { count: 7, title: "Semana Perfeita", desc: "Conquistar sete dias de glória", icon: "Calendar" },
    { count: 15, title: "Disciplina de Ferro", desc: "Forjar uma vontade inquebrantável", icon: "Anvil" },
    { count: 30, title: "Mês Lendário", desc: "Transformar um mês em lenda", icon: "Trophy" },
    { count: 60, title: "Hábito Diamante", desc: "Cristalizar a excelência", icon: "Diamond" },
    { count: 100, title: "Centurião dos Estudos", desc: "Liderar cem batalhas do conhecimento", icon: "Sword" },
    { count: 180, title: "Meio Ano Épico", desc: "Esculpir seis meses de grandeza", icon: "Mountain" },
    { count: 300, title: "Mestre da Consistência", desc: "Alcançar a perfeição da regularidade", icon: "Target" },
    { count: 365, title: "Ano Imortal", desc: "Criar um ano que jamais será esquecido", icon: "Star" }
  ];

  sessionTitles.forEach(({ count, title, desc, icon }) => {
    if (count <= (userLevel * 20)) {
      dynamicAchievements.push({
        achievement_id: `session_${count}`,
        title: title,
        description: `${desc} (${count} sessões)`,
        icon: icon,
        xp_reward: count * 15,
        condition_type: "sessions_completed",
        condition_value: count
      });
    }
  });

  // Challenge achievements with unique themes
  const challengeTitles = [
    { count: 3, title: "Contra o Relógio", desc: "Superar o tempo em 3 desafios", icon: "Clock" },
    { count: 10, title: "Mestre da Pressão", desc: "Manter a calma sob pressão", icon: "Flame" },
    { count: 25, title: "Ninja da Agilidade", desc: "Completar desafios com velocidade", icon: "Wind" },
    { count: 50, title: "Demolidor de Recordes", desc: "Quebrar seus próprios limites", icon: "Anvil" },
    { count: 75, title: "Imparável", desc: "Nada pode te deter", icon: "Mountain" },
    { count: 100, title: "Lenda do Cronômetro", desc: "Dominar o tempo completamente", icon: "Bolt" }
  ];

  challengeTitles.forEach(({ count, title, desc, icon }) => {
    if (count <= (userLevel * 8)) {
      dynamicAchievements.push({
        achievement_id: `challenge_${count}`,
        title: title,
        description: `${desc} (${count} desafios)`,
        icon: icon,
        xp_reward: count * 25,
        condition_type: "timed_challenges_completed",
        condition_value: count
      });
    }
  });

  return [...baseAchievements, ...dynamicAchievements];
};

export const getTotalAchievementsForLevel = (userLevel) => {
  return generateDynamicAchievements(userLevel).length;
};

export const getUnlockedCount = (userAchievements, userLevel) => {
  const allPossibleAchievements = generateDynamicAchievements(userLevel);
  return allPossibleAchievements.filter(ach => 
    userAchievements.includes(ach.achievement_id)
  ).length;
};