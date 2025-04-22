/**
 * Processes the raw data fetched from Firebase into a more structured format.
 * - Cleans up null entries from arrays.
 * - Filters ClassInstances to include only today and future dates.
 * - Embeds related ClassType and Teacher info.
 * - Groups future ClassInstances under their parent Class.
 */
export const processFirebaseData = (rawData) => {
    const {
      classes: rawClasses = [],
      classInstances: rawClassInstances = [],
      classTypes: rawClassTypes = [],
      teachers: rawTeachers = [],
    } = rawData;
  
    // --- Data Cleaning & Basic Indexing ---
    const classes = rawClasses.map((cls, index) => cls ? { ...cls, id: index } : null).filter(Boolean);
    const classTypes = rawClassTypes.map((type, index) => type ? { ...type, id: index } : null).filter(Boolean);
    const teachers = rawTeachers.map((teacher, index) => teacher ? { ...teacher, id: index } : null).filter(Boolean);
  
    // --- Calculate Today's Date (as YYYYMMDD number for easy comparison) ---
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0'); // Months are 0-based
    const dd = String(today.getDate()).padStart(2, '0');
    const todayNum = parseInt(`${yyyy}${mm}${dd}`, 10);
    // --- End Date Calculation ---
  
    // --- Filter ClassInstances for Today/Future Dates ---
    const futureClassInstances = rawClassInstances
      .map((inst, index) => (inst ? { ...inst, id: index } : null)) // Add ID first
      .filter(inst => {
          if (!inst || !inst.date) return false; // Skip nulls or instances missing date
  
          // Compare using YYYYMMDD numbers to avoid timezone issues with Date objects
          try {
              const instDateStr = inst.date.replace(/-/g, ''); // Remove hyphens: "YYYY-MM-DD" -> "YYYYMMDD"
              const instNum = parseInt(instDateStr, 10);
              // Keep if the instance date number is greater than or equal to today's number
              return !isNaN(instNum) && instNum >= todayNum;
          } catch (e) {
              console.warn(`[dataProcessor] Could not parse date for comparison: ${inst.date}`, e);
              return false; // Exclude if date format is invalid
          }
      });
    // --- End Instance Filtering ---
  
  
    // --- Create Maps (use future instances for the instance map) ---
    const classTypeMap = new Map(classTypes.map(type => [type.id, type]));
    const teacherMap = new Map(teachers.map(teacher => [teacher.id, teacher]));
    const classMap = new Map(classes.map(cls => [cls.id, cls]));
    // This map now only contains instances >= today
    const classInstanceMap = new Map(futureClassInstances.map(inst => [inst.id, inst]));
    // --- End Map Creation ---
  
  
    // --- Data Merging (using futureClassInstances) ---
    const processedClasses = classes.map(cls => {
      // Find related ClassType
      const classType = classTypeMap.get(cls.classTypeId);
  
      // Find related FUTURE ClassInstances for this Class
      const instances = futureClassInstances // Use the pre-filtered list
        .filter(instance => instance.classId === cls.id) // Filter by classId
        .map(instance => {
          // Find related Teacher for this Instance
          const teacher = teacherMap.get(instance.teacherId);
          return {
            ...instance,
            teacher: teacher || { name: 'Unknown Teacher', basicInfo: '' }, // Fallback
          };
        })
        // Sort the remaining future instances by date (ascending)
        .sort((a, b) => {
             const dateANum = parseInt(a.date.replace(/-/g, ''), 10) || 0;
             const dateBNum = parseInt(b.date.replace(/-/g, ''), 10) || 0;
             return dateANum - dateBNum;
         });
  
      return {
        ...cls,
        classType: classType || { name: 'Unknown Type', description: '' }, // Fallback
        instances: instances, // Embed ONLY future instances array
        daysOfWeek: Array.isArray(cls.daysOfWeek) ? cls.daysOfWeek : [],
      };
    });
  
    // Return the processed data structure and maps (maps now reflect future instances)
    return {
      processedClasses, // Contains classes, each embedding only its future instances
      classMap,         // Map<classId, classObject>
      classInstanceMap, // Map<instanceId, futureInstanceObject>
      teacherMap,       // Map<teacherId, teacherObject>
      classTypeMap,     // Map<typeId, typeObject>
    };
  };