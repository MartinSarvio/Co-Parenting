import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { normalizeSubscription } from '@/lib/subscription';
import type {
  User,
  Child,
  Household,
  Institution,
  CustodyPlan,
  CalendarEvent,
  Task,
  ShoppingItem,
  MealPlan,
  Message,
  MessageThread,
  Milestone,
  Document,
  Expense,
  PaymentAccount,
  MoneyTransfer,
  Handover,
  Notification,
  MeetingMinutes,
  ChildWellbeingNote,
  FamilyPhoto,
  DiaryEntry,
  KeyDate,
  DecisionLog,
  EventTemplate,
  CalendarColorPreferences,
  CalendarSharing,
  FridgeItem,
  Recipe,
} from '@/types';

interface AppStore {
  // Auth state
  currentUser: User | null;
  isAuthenticated: boolean;
  isProfessionalView: boolean;
  currentChildId: string | null;
  
  // Data
  users: User[];
  children: Child[];
  institutions: Institution[];
  household: Household | null;
  paymentAccounts: PaymentAccount[];
  transfers: MoneyTransfer[];
  custodyPlans: CustodyPlan[];
  events: CalendarEvent[];
  tasks: Task[];
  shoppingItems: ShoppingItem[];
  mealPlans: MealPlan[];
  messages: Message[];
  threads: MessageThread[];
  milestones: Milestone[];
  documents: Document[];
  expenses: Expense[];
  handovers: Handover[];
  notifications: Notification[];
  meetingMinutes: MeetingMinutes[];
  photos: FamilyPhoto[];
  diaryEntries: DiaryEntry[];
  keyDates: KeyDate[];
  decisions: DecisionLog[];
  eventTemplates: EventTemplate[];
  calendarColorPreferences: CalendarColorPreferences;
  calendarSharing: CalendarSharing | null;
  fridgeItems: FridgeItem[];
  userRecipes: Recipe[];

  // UI state
  activeTab: string;
  isLoading: boolean;
  
  // Actions
  setCurrentUser: (user: User | null) => void;
  setAuthenticated: (value: boolean) => void;
  setProfessionalView: (value: boolean) => void;
  setCurrentChildId: (id: string | null) => void;
  setActiveTab: (tab: string) => void;
  
  // Child management
  addChild: (child: Child) => void;
  updateChild: (id: string, child: Partial<Child>) => void;
  removeChild: (id: string) => void;
  setCurrentChild: (childId: string) => void;
  
  // Institution management
  addInstitution: (institution: Institution) => void;
  updateInstitution: (id: string, institution: Partial<Institution>) => void;
  removeInstitution: (id: string) => void;
  
  // Data actions
  addUser: (user: User) => void;
  updateUser: (id: string, user: Partial<User>) => void;
  setHousehold: (household: Household) => void;
  addPaymentAccount: (account: PaymentAccount) => void;
  updatePaymentAccount: (id: string, account: Partial<PaymentAccount>) => void;
  addTransfer: (transfer: MoneyTransfer) => void;
  updateTransfer: (id: string, transfer: Partial<MoneyTransfer>) => void;
  addCustodyPlan: (plan: CustodyPlan) => void;
  updateCustodyPlan: (id: string, plan: Partial<CustodyPlan>) => void;
  addEvent: (event: CalendarEvent) => void;
  updateEvent: (id: string, event: Partial<CalendarEvent>) => void;
  deleteEvent: (id: string) => void;
  addTask: (task: Task) => void;
  updateTask: (id: string, task: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  addShoppingItem: (item: ShoppingItem) => void;
  updateShoppingItem: (id: string, item: Partial<ShoppingItem>) => void;
  deleteShoppingItem: (id: string) => void;
  addMealPlan: (mealPlan: MealPlan) => void;
  updateMealPlan: (id: string, mealPlan: Partial<MealPlan>) => void;
  deleteMealPlan: (id: string) => void;
  addMessage: (message: Message) => void;
  addThread: (thread: MessageThread) => void;
  deleteMessage: (messageId: string, userId: string) => void;
  deleteThread: (threadId: string, userId: string) => void;
  addMilestone: (milestone: Milestone) => void;
  addDocument: (document: Document) => void;
  
  // Expense actions
  addExpense: (expense: Expense) => void;
  updateExpense: (id: string, expense: Partial<Expense>) => void;
  approveExpense: (id: string, userId: string) => void;
  disputeExpense: (id: string, reason: string, disputedBy: string) => void;
  resolveExpenseDispute: (id: string, resolutionNote: string, resolvedBy: string) => void;
  deleteExpense: (id: string) => void;
  
  addHandover: (handover: Handover) => void;
  updateHandover: (id: string, handover: Partial<Handover>) => void;
  addHandoverWellbeing: (handoverId: string, note: ChildWellbeingNote) => void;
  addNotification: (notification: Notification) => void;
  markNotificationRead: (id: string) => void;
  addMeetingMinutes: (minutes: MeetingMinutes) => void;
  updateMeetingMinutes: (id: string, minutes: Partial<MeetingMinutes>) => void;
  approveMeetingMinutes: (id: string, userId: string) => void;

  // Photo album
  addPhoto: (photo: FamilyPhoto) => void;
  deletePhoto: (id: string) => void;

  // Diary
  addDiaryEntry: (entry: DiaryEntry) => void;
  updateDiaryEntry: (id: string, entry: Partial<DiaryEntry>) => void;
  deleteDiaryEntry: (id: string) => void;

  // Key dates
  addKeyDate: (keyDate: KeyDate) => void;
  updateKeyDate: (id: string, keyDate: Partial<KeyDate>) => void;
  deleteKeyDate: (id: string) => void;

  // Decisions
  addDecision: (decision: DecisionLog) => void;
  updateDecision: (id: string, decision: Partial<DecisionLog>) => void;
  approveDecision: (id: string, userId: string) => void;
  rejectDecision: (id: string) => void;
  deleteDecision: (id: string) => void;

  // Event templates
  addEventTemplate: (template: EventTemplate) => void;
  deleteEventTemplate: (id: string) => void;

  // Calendar preferences
  setCalendarColorPreference: (eventType: string, color: string) => void;
  resetCalendarColorPreferences: () => void;

  // Calendar sharing
  requestCalendarSharing: (requestedBy: string) => void;
  respondToCalendarSharing: (accepted: boolean) => void;

  // Fridge
  addFridgeItem: (item: FridgeItem) => void;
  removeFridgeItem: (id: string) => void;
  clearFridge: () => void;

  // User recipes
  addUserRecipe: (recipe: Recipe) => void;
  removeUserRecipe: (id: string) => void;
  toggleRecipeShared: (id: string) => void;

  // Family members
  addFamilyMember: (user: User) => void;
  removeFamilyMember: (userId: string) => void;

  // Bulk setters for server data
  hydrateFromServer: (data: {
    users?: User[];
    household?: Household | null;
    children?: Child[];
    events?: CalendarEvent[];
    tasks?: Task[];
    expenses?: Expense[];
    documents?: Document[];
    mealPlans?: MealPlan[];
    threads?: MessageThread[];
    decisions?: DecisionLog[];
    keyDates?: KeyDate[];
    diaryEntries?: DiaryEntry[];
    milestones?: Milestone[];
  }) => void;

  // Auth
  logout: () => void;

  // Initialize demo data
  initDemoData: () => void;
  initProfessionalDemo: () => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      // Initial state
      currentUser: null,
      isAuthenticated: false,
      isProfessionalView: false,
      currentChildId: null,
      users: [],
      children: [],
      institutions: [],
      household: null,
      paymentAccounts: [],
      transfers: [],
      custodyPlans: [],
      events: [],
      tasks: [],
      shoppingItems: [],
      mealPlans: [],
      messages: [],
      threads: [],
      milestones: [],
      documents: [],
      expenses: [],
      handovers: [],
      notifications: [],
      meetingMinutes: [],
      photos: [],
      diaryEntries: [],
      keyDates: [],
      decisions: [],
      eventTemplates: [],
      calendarColorPreferences: {},
      calendarSharing: null,
      fridgeItems: [],
      userRecipes: [],
      activeTab: 'dashboard',
      isLoading: false,
      
      // Actions
      setCurrentUser: (user) => set({ currentUser: user }),
      setAuthenticated: (value) => set({ isAuthenticated: value }),
      setProfessionalView: (value) => set((state) => ({
        isProfessionalView: state.household?.familyMode === 'together' ? false : value
      })),
      setCurrentChildId: (id) => set({ currentChildId: id }),
      setActiveTab: (tab) => set({ activeTab: tab }),
      
      // Child management
      addChild: (child) => set((state) => ({ 
        children: [...state.children, child],
        currentChildId: state.currentChildId || child.id
      })),
      updateChild: (id, updatedChild) => set((state) => ({
        children: state.children.map(c => c.id === id ? { ...c, ...updatedChild } : c)
      })),
      removeChild: (id) => set((state) => ({
        children: state.children.filter(c => c.id !== id),
        currentChildId: state.currentChildId === id 
          ? state.children.find(c => c.id !== id)?.id || null 
          : state.currentChildId
      })),
      setCurrentChild: (childId) => set({ currentChildId: childId }),
      
      // Institution management
      addInstitution: (institution) => set((state) => ({ 
        institutions: [...state.institutions, institution] 
      })),
      updateInstitution: (id, updatedInstitution) => set((state) => ({
        institutions: state.institutions.map(i => i.id === id ? { ...i, ...updatedInstitution } : i)
      })),
      removeInstitution: (id) => set((state) => ({
        institutions: state.institutions.filter(i => i.id !== id)
      })),
      
      addUser: (user) => set((state) => ({ users: [...state.users, user] })),
      updateUser: (id, updatedUser) => set((state) => ({
        users: state.users.map((user) => user.id === id ? { ...user, ...updatedUser } : user),
        currentUser: state.currentUser?.id === id
          ? { ...state.currentUser, ...updatedUser }
          : state.currentUser
      })),
      setHousehold: (household) => set((state) => ({
        household: {
          ...household,
          subscription: normalizeSubscription(household)
        },
        isProfessionalView: household.familyMode === 'together' ? false : state.isProfessionalView,
        activeTab: household.familyMode === 'together' && state.activeTab === 'cases' ? 'dashboard' : state.activeTab
      })),
      addPaymentAccount: (account) => set((state) => ({
        paymentAccounts: [
          ...state.paymentAccounts.map((item) =>
            item.userId === account.userId && account.isPrimary
              ? { ...item, isPrimary: false }
              : item
          ),
          account
        ]
      })),
      updatePaymentAccount: (id, updatedAccount) => set((state) => ({
        paymentAccounts: state.paymentAccounts.map((account) => {
          if (account.id === id) {
            return { ...account, ...updatedAccount };
          }
          if (updatedAccount.isPrimary && account.userId === state.paymentAccounts.find((item) => item.id === id)?.userId) {
            return { ...account, isPrimary: false };
          }
          return account;
        })
      })),
      addTransfer: (transfer) => set((state) => ({
        transfers: [...state.transfers, transfer]
      })),
      updateTransfer: (id, updatedTransfer) => set((state) => ({
        transfers: state.transfers.map((transfer) =>
          transfer.id === id ? { ...transfer, ...updatedTransfer } : transfer
        )
      })),
      addCustodyPlan: (plan) => set((state) => ({ custodyPlans: [...state.custodyPlans, plan] })),
      updateCustodyPlan: (id, updatedPlan) => set((state) => ({
        custodyPlans: state.custodyPlans.map(p => p.id === id ? { ...p, ...updatedPlan } : p)
      })),
      
      addEvent: (event) => set((state) => ({ events: [...state.events, event] })),
      updateEvent: (id, updatedEvent) => set((state) => ({
        events: state.events.map(e => e.id === id ? { ...e, ...updatedEvent } : e)
      })),
      deleteEvent: (id) => set((state) => ({
        events: state.events.filter(e => e.id !== id)
      })),
      
      addTask: (task) => set((state) => ({ tasks: [...state.tasks, task] })),
      updateTask: (id, updatedTask) => set((state) => ({
        tasks: state.tasks.map(t => t.id === id ? { ...t, ...updatedTask } : t)
      })),
      deleteTask: (id) => set((state) => ({
        tasks: state.tasks.filter(t => t.id !== id)
      })),
      
      addShoppingItem: (item) => set((state) => ({ 
        shoppingItems: [...state.shoppingItems, item] 
      })),
      updateShoppingItem: (id, updatedItem) => set((state) => ({
        shoppingItems: state.shoppingItems.map(i => i.id === id ? { ...i, ...updatedItem } : i)
      })),
      deleteShoppingItem: (id) => set((state) => ({
        shoppingItems: state.shoppingItems.filter(i => i.id !== id)
      })),

      addMealPlan: (mealPlan) => set((state) => ({
        mealPlans: [...state.mealPlans, mealPlan]
      })),
      updateMealPlan: (id, updatedMealPlan) => set((state) => ({
        mealPlans: state.mealPlans.map(m => m.id === id ? { ...m, ...updatedMealPlan } : m)
      })),
      deleteMealPlan: (id) => set((state) => ({
        mealPlans: state.mealPlans.filter(m => m.id !== id)
      })),
      
      addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
      addThread: (thread) => set((state) => ({ threads: [...state.threads, thread] })),
      deleteMessage: (messageId, userId) => set((state) => ({
        messages: state.messages.map(m =>
          m.id === messageId
            ? { ...m, deletedBy: [...(m.deletedBy || []), userId] }
            : m
        ),
      })),
      deleteThread: (threadId, userId) => set((state) => ({
        threads: state.threads.map(t =>
          t.id === threadId
            ? { ...t, deletedBy: [...(t.deletedBy || []), userId] }
            : t
        ),
      })),
      addMilestone: (milestone) => set((state) => ({ 
        milestones: [...state.milestones, milestone] 
      })),
      addDocument: (document) => set((state) => ({ 
        documents: [...state.documents, document] 
      })),
      
      // Expense actions
      addExpense: (expense) => set((state) => ({ expenses: [...state.expenses, expense] })),
      updateExpense: (id, updatedExpense) => set((state) => ({
        expenses: state.expenses.map(e => e.id === id ? { ...e, ...updatedExpense } : e)
      })),
      approveExpense: (id, userId) => set((state) => ({
        expenses: state.expenses.map(e => 
          e.id === id 
            ? { ...e, approvedBy: [...(e.approvedBy || []), userId] }
            : e
        )
      })),
      disputeExpense: (id, reason, disputedBy) => set((state) => ({
        expenses: state.expenses.map(e =>
          e.id === id
            ? {
                ...e,
                status: 'disputed',
                disputeReason: reason,
                disputedBy,
                disputedAt: new Date().toISOString()
              }
            : e
        )
      })),
      resolveExpenseDispute: (id, resolutionNote, resolvedBy) => set((state) => ({
        expenses: state.expenses.map(e =>
          e.id === id
            ? {
                ...e,
                status: 'pending',
                resolutionNote,
                resolvedAt: new Date().toISOString(),
                resolvedBy
              }
            : e
        )
      })),
      deleteExpense: (id) => set((state) => ({
        expenses: state.expenses.filter(e => e.id !== id)
      })),
      
      addHandover: (handover) => set((state) => ({ 
        handovers: [...state.handovers, handover] 
      })),
      updateHandover: (id, updatedHandover) => set((state) => ({
        handovers: state.handovers.map(h => h.id === id ? { ...h, ...updatedHandover } : h)
      })),
      addHandoverWellbeing: (handoverId, note) => set((state) => ({
        handovers: state.handovers.map(h => 
          h.id === handoverId 
            ? { ...h, childWellbeing: note }
            : h
        )
      })),
      
      addNotification: (notification) => set((state) => ({ 
        notifications: [...state.notifications, notification] 
      })),
      markNotificationRead: (id) => set((state) => ({
        notifications: state.notifications.map(n => 
          n.id === id ? { ...n, read: true } : n
        )
      })),
      
      addMeetingMinutes: (minutes) => set((state) => ({
        meetingMinutes: [...state.meetingMinutes, minutes]
      })),
      updateMeetingMinutes: (id, updatedMinutes) => set((state) => ({
        meetingMinutes: state.meetingMinutes.map(m => 
          m.id === id ? { ...m, ...updatedMinutes } : m
        )
      })),
      approveMeetingMinutes: (id, userId) => set((state) => ({
        meetingMinutes: state.meetingMinutes.map(m =>
          m.id === id
            ? { ...m, approvedBy: [...(m.approvedBy || []), userId] }
            : m
        )
      })),

      // Photo album
      addPhoto: (photo) => set((state) => ({ photos: [...state.photos, photo] })),
      deletePhoto: (id) => set((state) => ({ photos: state.photos.filter(p => p.id !== id) })),

      // Diary
      addDiaryEntry: (entry) => set((state) => ({ diaryEntries: [...state.diaryEntries, entry] })),
      updateDiaryEntry: (id, entry) => set((state) => ({
        diaryEntries: state.diaryEntries.map(d => d.id === id ? { ...d, ...entry } : d)
      })),
      deleteDiaryEntry: (id) => set((state) => ({ diaryEntries: state.diaryEntries.filter(d => d.id !== id) })),

      // Key dates
      addKeyDate: (keyDate) => set((state) => ({ keyDates: [...state.keyDates, keyDate] })),
      updateKeyDate: (id, keyDate) => set((state) => ({
        keyDates: state.keyDates.map(k => k.id === id ? { ...k, ...keyDate } : k)
      })),
      deleteKeyDate: (id) => set((state) => ({ keyDates: state.keyDates.filter(k => k.id !== id) })),

      // Decisions
      addDecision: (decision) => set((state) => ({ decisions: [...state.decisions, decision] })),
      updateDecision: (id, decision) => set((state) => ({
        decisions: state.decisions.map(d => d.id === id ? { ...d, ...decision } : d)
      })),
      approveDecision: (id, userId) => set((state) => ({
        decisions: state.decisions.map(d =>
          d.id === id
            ? { ...d, approvedBy: [...d.approvedBy, userId], status: 'approved' as const }
            : d
        )
      })),
      rejectDecision: (id) => set((state) => ({
        decisions: state.decisions.map(d =>
          d.id === id ? { ...d, status: 'rejected' as const } : d
        )
      })),
      deleteDecision: (id) => set((state) => ({ decisions: state.decisions.filter(d => d.id !== id) })),

      // Event templates
      addEventTemplate: (template) => set((state) => ({ eventTemplates: [...state.eventTemplates, template] })),
      deleteEventTemplate: (id) => set((state) => ({ eventTemplates: state.eventTemplates.filter(t => t.id !== id) })),

      // Calendar color preferences
      setCalendarColorPreference: (eventType, color) => set((state) => ({
        calendarColorPreferences: { ...state.calendarColorPreferences, [eventType]: color }
      })),
      resetCalendarColorPreferences: () => set({ calendarColorPreferences: {} }),

      // Calendar sharing
      requestCalendarSharing: (requestedBy) => set({
        calendarSharing: { requestedBy, requestedAt: new Date().toISOString(), status: 'pending' }
      }),
      respondToCalendarSharing: (accepted) => set((state) => ({
        calendarSharing: state.calendarSharing
          ? { ...state.calendarSharing, status: accepted ? 'accepted' : 'rejected', acceptedAt: accepted ? new Date().toISOString() : undefined }
          : null
      })),

      // Fridge
      addFridgeItem: (item) => set((state) => ({ fridgeItems: [...state.fridgeItems, item] })),
      removeFridgeItem: (id) => set((state) => ({ fridgeItems: state.fridgeItems.filter(f => f.id !== id) })),
      clearFridge: () => set({ fridgeItems: [] }),

      // User recipes
      addUserRecipe: (recipe) => set((state) => ({ userRecipes: [...state.userRecipes, recipe] })),
      removeUserRecipe: (id) => set((state) => ({ userRecipes: state.userRecipes.filter(r => r.id !== id) })),
      toggleRecipeShared: (id) => set((state) => ({
        userRecipes: state.userRecipes.map(r => r.id === id ? { ...r, isShared: !r.isShared } : r),
      })),

      // Family members
      addFamilyMember: (user) => set((state) => ({
        users: [...state.users, user],
        household: state.household ? { ...state.household, members: [...state.household.members, user.id] } : state.household,
      })),
      removeFamilyMember: (userId) => set((state) => ({
        users: state.users.filter(u => u.id !== userId),
        household: state.household ? { ...state.household, members: state.household.members.filter(id => id !== userId) } : state.household,
      })),

      // Bulk setters for server data
      hydrateFromServer: (data) => set((state) => ({
        users: data.users ?? state.users,
        household: data.household !== undefined ? (data.household ? { ...data.household, subscription: normalizeSubscription(data.household) } : null) : state.household,
        children: data.children ?? state.children,
        events: data.events ?? state.events,
        tasks: data.tasks ?? state.tasks,
        expenses: data.expenses ?? state.expenses,
        documents: data.documents ?? state.documents,
        mealPlans: data.mealPlans ?? state.mealPlans,
        threads: data.threads ?? state.threads,
        decisions: data.decisions ?? state.decisions,
        keyDates: data.keyDates ?? state.keyDates,
        diaryEntries: data.diaryEntries ?? state.diaryEntries,
        milestones: data.milestones ?? state.milestones,
        currentChildId: data.children && data.children.length > 0
          ? (state.currentChildId && data.children.some(c => c.id === state.currentChildId)
              ? state.currentChildId
              : data.children[0].id)
          : state.currentChildId,
      })),

      // Auth — clear everything on logout
      logout: () => set({
        currentUser: null,
        isAuthenticated: false,
        isProfessionalView: false,
        currentChildId: null,
        users: [],
        children: [],
        institutions: [],
        household: null,
        paymentAccounts: [],
        transfers: [],
        custodyPlans: [],
        events: [],
        tasks: [],
        shoppingItems: [],
        mealPlans: [],
        messages: [],
        threads: [],
        milestones: [],
        documents: [],
        expenses: [],
        handovers: [],
        notifications: [],
        meetingMinutes: [],
        photos: [],
        diaryEntries: [],
        keyDates: [],
        decisions: [],
        eventTemplates: [],
        calendarColorPreferences: {},
        calendarSharing: null,
        fridgeItems: [],
        userRecipes: [],
        activeTab: 'dashboard',
      }),

      // Initialize demo data for parents
      initDemoData: () => {
        const parent1: User = {
          id: 'p1',
          name: 'Martin Sarvio Kristensen',
          email: 'martin@example.com',
          color: 'cool',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Martin',
          role: 'parent',
          phone: '+45 1234 5678',
          address: {
            street: 'Østerbrogade 123, 3. th',
            city: 'København',
            postalCode: '2100',
            country: 'Danmark'
          }
        };
        
        const parent2: User = {
          id: 'p2',
          name: 'Anne Schrøder Pedersen',
          email: 'anne@example.com',
          color: 'warm',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Anne&gender=female',
          role: 'parent',
          phone: '+45 8765 4321',
          address: {
            street: 'Nørrebrogade 456, 2. tv',
            city: 'København',
            postalCode: '2200',
            country: 'Danmark'
          }
        };
        
        const child: Child = {
          id: 'c1',
          name: 'Maison Schrøder Sarvio',
          birthDate: '2024-09-03',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maison&gender=male',
          parent1Id: 'p1',
          parent2Id: 'p2',
          allergies: [],
          medications: [],
          emergencyContacts: [
            { id: 'ec1', name: 'Bedstemor Inge', relation: 'Bedstemor', phone: '+45 1111 2222' }
          ],
          institutions: ['inst1']
        };

        const institution: Institution = {
          id: 'inst1',
          name: 'Solstrålen Vuggestue',
          type: 'daycare',
          address: {
            street: 'Børnegade 10',
            city: 'København',
            postalCode: '2100',
            country: 'Danmark'
          },
          phone: '+45 3333 4444',
          email: 'solstraaelen@kommune.dk',
          contactPerson: 'Pædagog Lene',
          openingHours: '07:00 - 17:00',
          children: ['c1']
        };
        
        const household: Household = {
          id: 'h1',
          name: 'Maison\'s Familie',
          members: ['p1', 'p2'],
          children: ['c1'],
          familyMode: 'co_parenting',
          calendarSources: [],
          subscription: {
            plan: 'free',
            billingModel: 'separate',
            status: 'active',
            startedAt: new Date().toISOString()
          },
          singleParentSupport: {
            evidenceVaultEnabled: false,
            autoArchiveReceipts: false,
            lawyerIds: []
          },
          custodyPlanId: 'cp1',
          caseNumber: 'BS-2024-001234',
          institutions: ['inst1']
        };
        
        const custodyPlan: CustodyPlan = {
          id: 'cp1',
          name: 'Uge-skifteordning med institution',
          pattern: 'weekday-weekend',
          startDate: '2024-11-01',
          childId: 'c1',
          swapDay: 0, // Monday
          swapTime: '07:30',
          swapLocation: {
            type: 'institution',
            institutionId: 'inst1',
            notes: 'Aflevering i vuggestue'
          },
          parent1Weeks: 1,
          parent2Weeks: 1,
          parent1Days: [0, 1, 2, 3, 4, 5, 6],
          parent2Days: [],
          weeklySchedule: [
            {
              dayOfWeek: 0, // Monday
              parent1: { hasCustody: true, dropoff: { time: '07:30', location: { type: 'institution', institutionId: 'inst1' } } },
              parent2: { hasCustody: false },
              institution: { id: 'inst1', dropoffTime: '07:30', pickupTime: '16:00' }
            },
            {
              dayOfWeek: 1, // Tuesday
              parent1: { hasCustody: true },
              parent2: { hasCustody: false },
              institution: { id: 'inst1', pickupTime: '16:00' }
            },
            {
              dayOfWeek: 2, // Wednesday
              parent1: { hasCustody: false },
              parent2: { hasCustody: true, pickup: { time: '16:00', location: { type: 'institution', institutionId: 'inst1' } } },
              institution: { id: 'inst1', pickupTime: '16:00' }
            },
            {
              dayOfWeek: 3, // Thursday
              parent1: { hasCustody: false },
              parent2: { hasCustody: true },
              institution: { id: 'inst1', pickupTime: '16:00' }
            },
            {
              dayOfWeek: 4, // Friday
              parent1: { hasCustody: true, pickup: { time: '16:00', location: { type: 'institution', institutionId: 'inst1' } } },
              parent2: { hasCustody: false },
              institution: { id: 'inst1', pickupTime: '16:00' }
            }
          ],
          holidays: [],
          specialDays: [],
          agreementDate: '2024-11-14',
          agreementValidUntil: '2025-11-14',
          agreementText: 'Samværsaftale vedrørende Maison Schrøder Sarvio'
        };
        
        const today = new Date();
        const dayMs = 24 * 60 * 60 * 1000;
        const startOfToday = new Date(today);
        startOfToday.setHours(0, 0, 0, 0);
        const getDateString = (offset: number) => new Date(startOfToday.getTime() + offset * dayMs).toISOString().split('T')[0];

        const mealPlans: MealPlan[] = [
          {
            id: 'meal1',
            date: getDateString(0),
            mealType: 'dinner',
            title: 'Kyllingefrikadeller med ovnkartofler',
            childId: 'c1',
            createdBy: 'p1',
            createdAt: today.toISOString(),
            recipe: {
              name: 'Kyllingefrikadeller med ovnkartofler',
              ingredients: ['500 g hakket kylling', '8 kartofler', '1 æg', '1 løg', 'Salt og peber'],
              instructions: 'Form frikadeller med kylling, æg og løg. Bag kartofler i ovnen ved 200 grader i 35 min. Steg frikadeller gyldne.'
            }
          },
          {
            id: 'meal2',
            date: getDateString(1),
            mealType: 'dinner',
            title: 'Laksefad med grøntsager',
            childId: 'c1',
            createdBy: 'p2',
            createdAt: today.toISOString(),
            recipe: {
              name: 'Laksefad med grøntsager',
              ingredients: ['2 laksefileter', '1 broccoli', '2 gulerødder', '2 spsk olie', 'Citron'],
              instructions: 'Skær grønt og vend med olie. Bag grøntsager 15 min, læg laks ovenpå og bag yderligere 12 min. Server med citron.'
            }
          },
          {
            id: 'meal3',
            date: getDateString(2),
            mealType: 'lunch',
            title: 'Rugbrødsmadder til institution',
            childId: 'c1',
            notes: 'Husk ekstra frugt i madkassen',
            createdBy: 'p1',
            createdAt: today.toISOString()
          }
        ];

        const tasks: Task[] = [
          {
            id: 'task1',
            title: 'Støvsug stue og børneværelse',
            assignedTo: 'p1',
            createdBy: 'p1',
            completed: false,
            category: 'cleaning',
            isRecurring: true,
            recurringPattern: 'weekly',
            plannedWeekday: 5,
            area: 'Stue + børneværelse'
          },
          {
            id: 'task2',
            title: 'Skift sengetøj',
            assignedTo: 'p2',
            createdBy: 'p1',
            completed: false,
            category: 'cleaning',
            isRecurring: true,
            recurringPattern: 'weekly',
            plannedWeekday: 6,
            area: 'Soveværelse'
          },
          {
            id: 'task3',
            title: 'Planlæg mad for næste uge',
            assignedTo: 'p1',
            createdBy: 'p2',
            completed: false,
            category: 'general',
            deadline: getDateString(4)
          }
        ];

        const shoppingItems: ShoppingItem[] = [
          {
            id: 'shop1',
            name: 'Hakket kylling',
            quantity: '500 g',
            purchased: false,
            addedBy: 'p1',
            category: 'Dagligvarer',
            neededForDate: getDateString(0),
            neededForMealId: 'meal1',
            priority: 'normal'
          },
          {
            id: 'shop2',
            name: 'Broccoli',
            quantity: '1 stk',
            purchased: false,
            addedBy: 'p2',
            category: 'Grønt',
            neededForDate: getDateString(1),
            neededForMealId: 'meal2',
            priority: 'normal'
          },
          {
            id: 'shop3',
            name: 'Vaskemiddel',
            quantity: '1 flaske',
            purchased: false,
            addedBy: 'p1',
            category: 'Husholdning',
            priority: 'low'
          }
        ];
        
        const expenses: Expense[] = [
          {
            id: 'exp1',
            title: 'Vuggestue - November',
            description: 'Månedlig betaling til Solstrålen',
            amount: 4250,
            currency: 'DKK',
            category: 'institution',
            paidBy: 'p1',
            splitWith: ['p1', 'p2'],
            splitAmounts: { p1: 2125, p2: 2125 },
            splitType: 'equal',
            date: '2024-11-01',
            status: 'paid',
            childId: 'c1',
            institutionId: 'inst1',
            createdAt: '2024-11-01',
            approvedBy: ['p1', 'p2']
          },
          {
            id: 'exp2',
            title: 'Bleer og plejeprodukter',
            description: 'Libero bleer og A-Derma creme',
            amount: 450,
            currency: 'DKK',
            category: 'other',
            paidBy: 'p2',
            splitWith: ['p1', 'p2'],
            splitAmounts: { p1: 225, p2: 225 },
            splitType: 'equal',
            date: '2024-11-10',
            status: 'pending',
            childId: 'c1',
            createdAt: '2024-11-10'
          }
        ];
        
        const handovers: Handover[] = [
          {
            id: 'h1',
            childId: 'c1',
            fromParentId: 'p1',
            toParentId: 'p2',
            scheduledDate: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 16, 0).toISOString(),
            status: 'pending',
            location: {
              type: 'institution',
              institutionId: 'inst1',
              notes: 'Aflevering i vuggestue kl. 16:00'
            },
            checklist: [
              { id: 'hc1', item: 'Bleer', completed: false, category: 'other' },
              { id: 'hc2', item: 'Ekstra tøj', completed: false, category: 'clothing' },
              { id: 'hc3', item: 'Sut', completed: false, category: 'toys' },
              { id: 'hc4', item: 'Favoritdyr', completed: false, category: 'toys' }
            ],
            notes: '',
            institutionHandover: true
          }
        ];
        
        const documents: Document[] = [
          {
            id: 'd1',
            childId: 'c1',
            title: 'Samværsaftale - Maison',
            type: 'custody_agreement',
            url: '#',
            uploadedBy: 'p1',
            uploadedAt: '2024-11-14',
            sharedWith: ['p1', 'p2'],
            isOfficial: true,
            validFrom: '2024-11-14',
            validUntil: '2025-11-14'
          },
          {
            id: 'd2',
            childId: 'c1',
            title: 'Indskrivningspapirer - Solstrålen',
            type: 'authority_document',
            url: '#',
            uploadedBy: 'p2',
            uploadedAt: '2024-10-15',
            sharedWith: ['p1', 'p2'],
            isOfficial: true,
            authorityReference: 'Københavns Kommune'
          }
        ];

        const paymentAccounts: PaymentAccount[] = [
          {
            id: 'pay1',
            userId: 'p1',
            provider: 'mobilepay',
            accountLabel: 'Martin MobilePay',
            accountHandle: '+45 1234 5678',
            isPrimary: true,
            createdAt: new Date().toISOString()
          },
          {
            id: 'pay2',
            userId: 'p2',
            provider: 'mobilepay',
            accountLabel: 'Anne MobilePay',
            accountHandle: '+45 8765 4321',
            isPrimary: true,
            createdAt: new Date().toISOString()
          }
        ];
        
        set({
          currentUser: parent1,
          isAuthenticated: true,
          isProfessionalView: false,
          currentChildId: 'c1',
          users: [parent1, parent2],
          children: [child],
          institutions: [institution],
          household: {
            ...household,
            subscription: normalizeSubscription(household)
          },
          paymentAccounts,
          transfers: [],
          custodyPlans: [custodyPlan],
          events: [],
          tasks,
          shoppingItems,
          mealPlans,
          messages: [],
          threads: [],
          milestones: [],
          documents,
          expenses,
          handovers,
          meetingMinutes: [],
          notifications: [],
          activeTab: 'dashboard'
        });
      },

      // Initialize demo data for professionals
      initProfessionalDemo: () => {
        const professional: User = {
          id: 'prof1',
          name: 'Lise Jensen',
          email: 'lise.jensen@kommune.dk',
          color: 'neutral',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lise',
          role: 'professional',
          professionalType: 'caseworker',
          organization: 'Børn- og Familieafdelingen, Københavns Kommune',
          canAccessCases: ['h1']
        };

        set({
          currentUser: professional,
          isAuthenticated: true,
          isProfessionalView: true,
          activeTab: 'cases'
        });
      }
    }),
    {
      name: 'familiekoordinering-storage',
      partialize: (state) => ({
        currentUser: state.currentUser,
        isAuthenticated: state.isAuthenticated,
        isProfessionalView: state.isProfessionalView,
        currentChildId: state.currentChildId,
        users: state.users,
        children: state.children,
        institutions: state.institutions,
        household: state.household,
        paymentAccounts: state.paymentAccounts,
        transfers: state.transfers,
        custodyPlans: state.custodyPlans,
        events: state.events,
        tasks: state.tasks,
        shoppingItems: state.shoppingItems,
        mealPlans: state.mealPlans,
        messages: state.messages,
        threads: state.threads,
        milestones: state.milestones,
        documents: state.documents,
        expenses: state.expenses,
        handovers: state.handovers,
        notifications: state.notifications,
        meetingMinutes: state.meetingMinutes,
        photos: state.photos,
        diaryEntries: state.diaryEntries,
        keyDates: state.keyDates,
        decisions: state.decisions,
        eventTemplates: state.eventTemplates,
        calendarColorPreferences: state.calendarColorPreferences,
        calendarSharing: state.calendarSharing,
        fridgeItems: state.fridgeItems,
        userRecipes: state.userRecipes,
        activeTab: state.activeTab
      })
    }
  )
);
