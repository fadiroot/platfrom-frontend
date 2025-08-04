-- ==============================================
-- SQL INSERT for BAC INFORMATIQUE Curriculum
-- Run this in Supabase SQL Editor
-- ==============================================

-- 1. INSERT LEVELS
INSERT INTO public.levels (title, description) VALUES 
('Bac 1 Informatique', 'Première année - Fondamentaux de l''informatique'),
('Bac 2 Informatique', 'Deuxième année - Programmation avancée et systèmes'),
('Bac 3 Informatique', 'Troisième année - Spécialisation et projets');

-- 2. INSERT SUBJECTS for BAC 1
INSERT INTO public.subjects (title, description, level_id) VALUES 
-- Bac 1 Subjects
('Algorithmique et Programmation', 'Introduction aux algorithmes et langages de programmation', (SELECT id FROM public.levels WHERE title = 'Bac 1 Informatique')),
('Mathématiques pour l''Informatique', 'Mathématiques discrètes, logique, probabilités', (SELECT id FROM public.levels WHERE title = 'Bac 1 Informatique')),
('Architecture des Ordinateurs', 'Fonctionnement interne des systèmes informatiques', (SELECT id FROM public.levels WHERE title = 'Bac 1 Informatique')),
('Systèmes d''Exploitation', 'Introduction aux OS et gestion des ressources', (SELECT id FROM public.levels WHERE title = 'Bac 1 Informatique')),

-- Bac 2 Subjects  
('Structures de Données', 'Structures avancées et complexité algorithmique', (SELECT id FROM public.levels WHERE title = 'Bac 2 Informatique')),
('Bases de Données', 'Conception et gestion des bases de données', (SELECT id FROM public.levels WHERE title = 'Bac 2 Informatique')),
('Programmation Orientée Objet', 'POO avec Java/C++, design patterns', (SELECT id FROM public.levels WHERE title = 'Bac 2 Informatique')),
('Réseaux Informatiques', 'Protocoles réseau et communication', (SELECT id FROM public.levels WHERE title = 'Bac 2 Informatique')),

-- Bac 3 Subjects
('Génie Logiciel', 'Méthodologies de développement et gestion de projets', (SELECT id FROM public.levels WHERE title = 'Bac 3 Informatique')),
('Intelligence Artificielle', 'Algorithmes d''IA et apprentissage automatique', (SELECT id FROM public.levels WHERE title = 'Bac 3 Informatique')),
('Sécurité Informatique', 'Cryptographie et sécurité des systèmes', (SELECT id FROM public.levels WHERE title = 'Bac 3 Informatique')),
('Développement Web', 'Technologies web modernes et frameworks', (SELECT id FROM public.levels WHERE title = 'Bac 3 Informatique'));

-- 3. INSERT CHAPTERS

-- Chapters for "Algorithmique et Programmation" (Bac 1)
INSERT INTO public.chapters (title, description, difficulty, type, estimated_time, subject_id) VALUES 
('Introduction aux Algorithmes', 'Concepts de base et notation algorithmique', 'Beginner', 'Theory', '3 heures', (SELECT id FROM public.subjects WHERE title = 'Algorithmique et Programmation')),
('Variables et Types de Données', 'Déclaration et manipulation des données', 'Beginner', 'Practical', '2 heures', (SELECT id FROM public.subjects WHERE title = 'Algorithmique et Programmation')),
('Structures de Contrôle', 'Conditions et boucles', 'Beginner', 'Practical', '4 heures', (SELECT id FROM public.subjects WHERE title = 'Algorithmique et Programmation')),
('Fonctions et Procédures', 'Modularité et réutilisabilité du code', 'Intermediate', 'Practical', '3 heures', (SELECT id FROM public.subjects WHERE title = 'Algorithmique et Programmation'));

-- Chapters for "Structures de Données" (Bac 2)  
INSERT INTO public.chapters (title, description, difficulty, type, estimated_time, subject_id) VALUES 
('Tableaux et Listes', 'Structures linéaires et leur implémentation', 'Intermediate', 'Theory', '2.5 heures', (SELECT id FROM public.subjects WHERE title = 'Structures de Données')),
('Piles et Files', 'Structures LIFO et FIFO', 'Intermediate', 'Practical', '3 heures', (SELECT id FROM public.subjects WHERE title = 'Structures de Données')),
('Arbres Binaires', 'Structures hiérarchiques et parcours', 'Advanced', 'Theory', '4 heures', (SELECT id FROM public.subjects WHERE title = 'Structures de Données')),
('Tables de Hachage', 'Accès direct et gestion des collisions', 'Advanced', 'Practical', '3.5 heures', (SELECT id FROM public.subjects WHERE title = 'Structures de Données'));

-- Chapters for "Bases de Données" (Bac 2)
INSERT INTO public.chapters (title, description, difficulty, type, estimated_time, subject_id) VALUES 
('Modèle Relationnel', 'Concepts fondamentaux des BD relationnelles', 'Beginner', 'Theory', '2 heures', (SELECT id FROM public.subjects WHERE title = 'Bases de Données')),
('SQL de Base', 'Requêtes SELECT, INSERT, UPDATE, DELETE', 'Beginner', 'Practical', '4 heures', (SELECT id FROM public.subjects WHERE title = 'Bases de Données')),
('Conception de BD', 'Modèle entité-association et normalisation', 'Intermediate', 'Theory', '3 heures', (SELECT id FROM public.subjects WHERE title = 'Bases de Données')),
('SQL Avancé', 'Jointures, sous-requêtes et fonctions', 'Advanced', 'Practical', '5 heures', (SELECT id FROM public.subjects WHERE title = 'Bases de Données'));

-- 4. INSERT EXERCISES

-- Exercises for "Introduction aux Algorithmes"
INSERT INTO public.exercises (name, difficulty, chapter_id, exercise_file_urls, correction_file_urls) VALUES 
('Algorithme de Tri à Bulles', 'Easy', (SELECT id FROM public.chapters WHERE title = 'Introduction aux Algorithmes'), 
 ARRAY['exercises/algo/tri_bulles_exercice.pdf'], 
 ARRAY['corrections/algo/tri_bulles_correction.pdf']),
 
('Recherche Séquentielle', 'Easy', (SELECT id FROM public.chapters WHERE title = 'Introduction aux Algorithmes'),
 ARRAY['exercises/algo/recherche_seq_exercice.pdf'], 
 ARRAY['corrections/algo/recherche_seq_correction.pdf']),
 
('Calcul de Complexité', 'Medium', (SELECT id FROM public.chapters WHERE title = 'Introduction aux Algorithmes'),
 ARRAY['exercises/algo/complexite_exercice.pdf'], 
 ARRAY['corrections/algo/complexite_correction.pdf']);

-- Exercises for "Variables et Types de Données"  
INSERT INTO public.exercises (name, difficulty, chapter_id, exercise_file_urls, correction_file_urls) VALUES 
('Déclaration de Variables', 'Easy', (SELECT id FROM public.chapters WHERE title = 'Variables et Types de Données'),
 ARRAY['exercises/variables/declaration_exercice.pdf'], 
 ARRAY['corrections/variables/declaration_correction.pdf']),
 
('Conversion de Types', 'Medium', (SELECT id FROM public.chapters WHERE title = 'Variables et Types de Données'),
 ARRAY['exercises/variables/conversion_exercice.pdf'], 
 ARRAY['corrections/variables/conversion_correction.pdf']);

-- Exercises for "Structures de Contrôle"
INSERT INTO public.exercises (name, difficulty, chapter_id, exercise_file_urls, correction_file_urls) VALUES 
('Conditions et Tests', 'Easy', (SELECT id FROM public.chapters WHERE title = 'Structures de Contrôle'),
 ARRAY['exercises/control/conditions_exercice.pdf'], 
 ARRAY['corrections/control/conditions_correction.pdf']),
 
('Boucles While et For', 'Medium', (SELECT id FROM public.chapters WHERE title = 'Structures de Contrôle'),
 ARRAY['exercises/control/boucles_exercice.pdf'], 
 ARRAY['corrections/control/boucles_correction.pdf']),
 
('Boucles Imbriquées', 'Hard', (SELECT id FROM public.chapters WHERE title = 'Structures de Contrôle'),
 ARRAY['exercises/control/boucles_imbriques_exercice.pdf'], 
 ARRAY['corrections/control/boucles_imbriques_correction.pdf']);

-- Exercises for "Tableaux et Listes" (Bac 2)
INSERT INTO public.exercises (name, difficulty, chapter_id, exercise_file_urls, correction_file_urls) VALUES 
('Manipulation de Tableaux', 'Medium', (SELECT id FROM public.chapters WHERE title = 'Tableaux et Listes'),
 ARRAY['exercises/tableaux/manipulation_exercice.pdf'], 
 ARRAY['corrections/tableaux/manipulation_correction.pdf']),
 
('Listes Chaînées', 'Hard', (SELECT id FROM public.chapters WHERE title = 'Tableaux et Listes'),
 ARRAY['exercises/listes/listes_chainees_exercice.pdf'], 
 ARRAY['corrections/listes/listes_chainees_correction.pdf']);

-- Exercises for "SQL de Base"
INSERT INTO public.exercises (name, difficulty, chapter_id, exercise_file_urls, correction_file_urls) VALUES 
('Requêtes SELECT Simples', 'Easy', (SELECT id FROM public.chapters WHERE title = 'SQL de Base'),
 ARRAY['exercises/sql/select_simple_exercice.pdf'], 
 ARRAY['corrections/sql/select_simple_correction.pdf']),
 
('INSERT et UPDATE', 'Medium', (SELECT id FROM public.chapters WHERE title = 'SQL de Base'),
 ARRAY['exercises/sql/insert_update_exercice.pdf'], 
 ARRAY['corrections/sql/insert_update_correction.pdf']),
 
('Requêtes avec WHERE', 'Medium', (SELECT id FROM public.chapters WHERE title = 'SQL de Base'),
 ARRAY['exercises/sql/where_exercice.pdf'], 
 ARRAY['corrections/sql/where_correction.pdf']);

-- 5. UPDATE CHAPTER EXERCISE COUNTS (automatically handled by triggers, but can be run manually)
UPDATE public.chapters SET exercise_count = (
    SELECT COUNT(*) FROM public.exercises WHERE chapter_id = chapters.id
);

-- 6. VERIFY DATA
SELECT 'LEVELS' as entity, COUNT(*) as count FROM public.levels
UNION ALL
SELECT 'SUBJECTS', COUNT(*) FROM public.subjects  
UNION ALL
SELECT 'CHAPTERS', COUNT(*) FROM public.chapters
UNION ALL
SELECT 'EXERCISES', COUNT(*) FROM public.exercises;