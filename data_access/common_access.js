module.exports = {
  setListFilters(data, queryObj) {
    if (data.filters) {
      var filterKeys = Object.keys(data.filters);
      if (filterKeys.length > 0) {
        filterArray = [];
        if (queryObj) filterArray.push(queryObj);
        filterKeys.forEach(filterKey => {
          if (
            !(
              typeof data.filters[filterKey] == "string" &&
              !data.filters[filterKey].trim()
            )
          ) {
            let filterObj = null;
            if (data.filters[filterKey] == false) {
              filterObj = {
                $or: [
                  { [filterKey]: { $exists: false } },
                  { [filterKey]: false }
                ]
              };
            } 
            else if(Array.isArray(data.filters[filterKey])){
            var array = []
              data.filters[filterKey].forEach(value => {
                array.push({ [filterKey]: value })
              });
              filterObj = {
                $or: array
              };
            }
            else {
              filterObj = {};
              filterObj[filterKey] = data.filters[filterKey];
            }
            if (filterObj) filterArray.push(filterObj);
          }
        });
        queryObj = { $and: filterArray };
      }
    }
    return queryObj;
  }
};
