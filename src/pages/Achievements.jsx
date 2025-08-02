
import React, { useState, useEffect } from 'react';
import { User } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ArrowLeft,
  Award,
  Lock,
  Sparkles,
  Trophy,
  Crown,
  CheckCircle,
  Badge,
  Star,
  Medal,
  Rocket,
  Library,
  BookCopy,
  History,
  Repeat,
  BrainCircuit,
  CalendarCheck,
  CalendarCheck2,
  CalendarClock,
  TimerReset,
  FastForward,
  Sprout,
  Package,
  Filter,
  Gem,
  Castle,
  Eye,
  Infinity,
  Zap,
  Sunrise,
  Shield,
  Footprints,
  Beaker,
  Clock,
  Flame,
  Calendar,
  Anvil,
  Diamond,
  Sword,
  Mountain,
  Target,
  Wind,
  Bolt,
  Plus,
  BookOpen,
  Brain } from
'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { getLevelForXp } from '@/components/gamification/utils';
import { generateDynamicAchievements, getTotalAchievementsForLevel, getUnlockedCount } from '@/components/gamification/DynamicAchievements';

export default function Achievements() {
  const navigate = useNavigate();
  const [achievements, setAchievements] = useState([]);
  const [userAchievements, setUserAchievements] = useState([]);
  const [userStats, setUserStats] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [newlyUnlocked, setNewlyUnlocked] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const user = await User.me();

      // Calculate real user stats with proper defaults
      const stats = {
        total_cards_created: Number(user.total_cards_created) || 0,
        total_sessions_completed: Number(user.total_sessions_completed) || 0,
        total_challenges_completed: Number(user.total_challenges_completed) || 0,
        total_cards_reviewed: Number(user.total_cards_reviewed) || 0,
        level: Number(user.level) || 1
      };

      // Generate dynamic achievements based on user level
      const dynamicAchievements = generateDynamicAchievements(stats.level);

      setAchievements(dynamicAchievements);
      setUserAchievements(user.achievements_unlocked || []);
      setUserStats(stats);

    } catch (error) {
      console.error("Erro ao carregar conquistas:", error);
      // Set safe defaults if user loading fails
      setAchievements([]);
      setUserAchievements([]);
      setUserStats({
        total_cards_created: 0,
        total_sessions_completed: 0,
        total_challenges_completed: 0,
        total_cards_reviewed: 0,
        level: 1
      });
    }
    setIsLoading(false);
  };

  const getProgressPercentage = (achievement) => {
    const isUnlocked = userAchievements.includes(achievement.achievement_id);
    if (isUnlocked) return 100;

    let currentValue = 0;

    try {
      switch (achievement.condition_type) {
        case 'cards_created':
          currentValue = userStats.total_cards_created || 0;
          break;
        case 'sessions_completed':
          currentValue = userStats.total_sessions_completed || 0;
          break;
        case 'timed_challenges_completed':
          currentValue = userStats.total_challenges_completed || 0;
          break;
        case 'cards_reviewed':
          currentValue = userStats.total_cards_reviewed || 0;
          break;
        case 'user_level':
          currentValue = userStats.level || 1;
          break;
        default:
          currentValue = 0;
      }

      return Math.min(currentValue / achievement.condition_value * 100, 100);
    } catch (error) {
      console.error("Error calculating progress:", error);
      return 0;
    }
  };

  const getAchievementIcon = (iconName, isUnlocked) => {
    const iconMap = {
      'Plus': Plus,
      'BookOpen': BookOpen,
      'Brain': Brain,
      'Timer': Clock,
      'Badge': Badge,
      'Star': Star,
      'Medal': Medal,
      'Rocket': Rocket,
      'Library': Library,
      'BookCopy': BookCopy,
      'History': History,
      'Repeat': Repeat,
      'BrainCircuit': BrainCircuit,
      'CalendarCheck': CalendarCheck,
      'CalendarCheck2': CalendarCheck2,
      'CalendarClock': CalendarClock,
      'TimerReset': TimerReset,
      'FastForward': FastForward,
      'Sprout': Sprout,
      'Package': Package,
      'Filter': Filter,
      'Gem': Gem,
      'Castle': Castle,
      'Eye': Eye,
      'Infinity': Infinity,
      'Zap': Zap,
      'Sunrise': Sunrise,
      'Shield': Shield,
      'Footprints': Footprints,
      'Beaker': Beaker,
      'Crown': Crown,
      'Clock': Clock,
      'Lock': Lock,
      'Flame': Flame,
      'Calendar': Calendar,
      'Anvil': Anvil,
      'Diamond': Diamond,
      'Sword': Sword,
      'Mountain': Mountain,
      'Target': Target,
      'Wind': Wind,
      'Bolt': Bolt
    };

    const IconComponent = iconMap[iconName] || Award;
    return <IconComponent className={`w-8 h-8 ${isUnlocked ? 'text-white' : 'text-slate-400'}`} />;
  };

  const unlockedCount = getUnlockedCount(userAchievements, userStats.level || 1);
  const totalCount = getTotalAchievementsForLevel(userStats.level || 1);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a223b] via-slate-800 to-blue-900 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent" />

      </div>);

  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a223b] via-slate-800 to-blue-900">
      <div className="max-w-4xl mx-auto w-full p-4 md:p-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8">

          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(createPageUrl("Dashboard"))} className="bg-slate-50 text-slate-950 text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border hover:text-accent-foreground h-10 w-10 border-slate-300 hover:bg-slate-700">


            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-slate-50 font-bold text-2xl md:text-3xl flex items-center gap-3">
              <Trophy className="w-8 h-8 text-yellow-500" />
              Minhas Conquistas
            </h1>
            <p className="text-slate-50">
              Você desbloqueou <strong>{unlockedCount}</strong> de <strong>{totalCount}</strong> conquistas • Nível {userStats.level || 1}
            </p>
            <p className="text-blue-200 text-sm">
              🎯 Novas conquistas aparecem conforme você evolui de nível!
            </p>
          </div>
        </motion.div>

        {/* Progress Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8">

          <Card className="border-0 shadow-xl bg-gradient-to-r from-purple-600 via-blue-600 to-teal-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Crown className="w-8 h-8 text-yellow-300" />
                  <div>
                    <h3 className="text-xl font-bold">Progresso Nível {userStats.level || 1}</h3>
                    <p className="text-blue-100">Continue evoluindo para desbloquear mais conquistas!</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold">{unlockedCount}</p>
                  <p className="text-blue-100">Desbloqueadas</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {achievements.map((ach, index) => {
              const isUnlocked = userAchievements.includes(ach.achievement_id);
              const progress = getProgressPercentage(ach);

              return (
                <motion.div
                  key={ach.achievement_id}
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  whileHover={{
                    scale: 1.05,
                    rotateY: isUnlocked ? 5 : 0,
                    transition: { duration: 0.2 }
                  }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ delay: index * 0.1 }}
                  className="cursor-pointer">

                  <Card className={`
                    relative overflow-hidden border-0 shadow-lg h-full transition-all duration-300
                    ${isUnlocked ?
                  'bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 shadow-yellow-200/50' :
                  'bg-white/80 backdrop-blur-sm hover:bg-white/90'}
                  `
                  }>
                    {isUnlocked &&
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-bold z-10 flex items-center gap-1">

                        <CheckCircle className="w-3 h-3" />
                        CONQUISTADO
                      </motion.div>
                    }

                    <CardContent className="relative p-6 text-center h-full flex flex-col justify-between">
                      <div>
                        {/* Achievement icon */}
                        <motion.div
                          className={`
                            w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 relative
                            ${isUnlocked ?
                          'bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 shadow-lg' :
                          'bg-slate-100'}
                          `
                          }>

                          {getAchievementIcon(ach.icon, isUnlocked)}
                        </motion.div>

                        {/* Title and description */}
                        <h3 className={`font-bold text-lg mb-2 ${
                        isUnlocked ? 'text-slate-800' : 'text-slate-600'}`
                        }>
                          {ach.title}
                        </h3>

                        <p className={`text-sm mb-4 ${
                        isUnlocked ? 'text-slate-700' : 'text-slate-500'}`
                        }>
                          {ach.description}
                        </p>

                        {/* Progress bar for locked achievements */}
                        {!isUnlocked &&
                        <div className="mb-4">
                            <div className="w-full bg-slate-200 rounded-full h-2">
                              <motion.div
                              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                              initial={{ width: 0 }}
                              animate={{ width: `${progress}%` }}
                              transition={{ duration: 1, delay: index * 0.1 }} />

                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                              {Math.round(progress)}% completo
                            </p>
                          </div>
                        }
                      </div>

                      {/* XP reward */}
                      {isUnlocked ?
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4 p-3 bg-gradient-to-r from-green-100 to-blue-100 rounded-lg border">

                          <div className="flex items-center justify-center gap-2">
                            <Sparkles className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-semibold text-green-700">
                              +{ach.xp_reward} XP Conquistado!
                            </span>
                          </div>
                        </motion.div> :

                      <div className="mt-4 p-3 bg-slate-100 rounded-lg border">
                          <div className="flex items-center justify-center gap-2">
                            <Sparkles className="w-4 h-4 text-slate-400" />
                            <span className="text-sm font-medium text-slate-500">
                              {ach.xp_reward} XP
                            </span>
                          </div>
                        </div>
                      }
                    </CardContent>
                  </Card>
                </motion.div>);

            })}
          </AnimatePresence>
        </div>

        {/* Stats summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">

          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-purple-600 text-white">
            <CardContent className="p-4 text-center">
              <Trophy className="w-8 h-8 mx-auto mb-2" />
              <p className="text-2xl font-bold">{unlockedCount}</p>
              <p className="text-sm opacity-90">Conquistas Desbloqueadas</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-teal-600 text-white">
            <CardContent className="p-4 text-center">
              <Sparkles className="w-8 h-8 mx-auto mb-2" />
              <p className="text-2xl font-bold">
                {achievements.reduce((sum, ach) =>
                userAchievements.includes(ach.achievement_id) ? sum + ach.xp_reward : sum, 0
                )}
              </p>
              <p className="text-sm opacity-90">XP de Conquistas</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-500 to-red-600 text-white">
            <CardContent className="p-4 text-center">
              <Award className="w-8 h-8 mx-auto mb-2" />
              <p className="text-2xl font-bold">{totalCount - unlockedCount}</p>
              <p className="text-sm opacity-90">Restantes Neste Nível</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>);

}