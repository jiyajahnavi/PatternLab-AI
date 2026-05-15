import { supabase } from './supabaseClient';

export const progressService = {
  async getTopicProgress(userId: string, topicSlug: string) {
    const { data, error } = await supabase
      .from('progress')
      .select('*')
      .eq('user_id', userId)
      .eq('topic_slug', topicSlug)
      .single();
      
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is not found
    return data;
  },

  async updateProgress(userId: string, topicSlug: string, updates: any) {
    const { data, error } = await supabase
      .from('progress')
      .upsert({ user_id: userId, topic_slug: topicSlug, ...updates })
      .select();
      
    if (error) throw error;
    return data;
  },
  
  async recordHeatmapActivity(userId: string, dateStr: string) {
    const { data: existing, error: _fetchError } = await supabase
      .from('heatmap')
      .select('count')
      .eq('user_id', userId)
      .eq('date', dateStr)
      .single();
      
    let count = 1;
    if (existing) {
      count = existing.count + 1;
    }
    
    const { error: upsertError } = await supabase
      .from('heatmap')
      .upsert({ user_id: userId, date: dateStr, count });
      
    if (upsertError) throw upsertError;
  }
};
