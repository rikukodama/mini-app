class Response {
    constructor() {
      this.obj = {
        success: false,
        data: null,
        error: ""
      };
      this.added = {};
    }
  
    ok(bool) {
      this.obj.success = !!bool;
      return this.getObj();
    }
  
    data(data) {
      this.obj.success = true;
      this.obj.data = this.stringify(data);
      return this.getObj();
    }
  
    error(message) {
      this.obj.success = false;
      this.obj.error = message instanceof Error ? message.message : message;
      return this.obj;
    }
  
    set(key, value) {
      if (!key) return false;
      this.added[key] = this.stringify(value);
      return this;
    }
  
    private stringify(data, fullPath = null) {
      if (typeof data !== "object" || data === null) {
        return data;
      }
  
      if (data.toJSON) return data.toJSON();
      if (data.toNumber) return data.toNumber();
      if (data.toString && data.toString !== Object.prototype.toString) {
        return data.toString();
      }
  
      if (fullPath && fullPath.includes(data)) return "[Circular]";
  
      const reObj = Array.isArray(data) ? [] : {};
      for (const key in data) {
        const path = fullPath ? [...fullPath, data] : [data];
        reObj[key] = this.stringify(data[key], path);
      }
      
      return reObj;
    }
  
    getObj() {
      return Object.keys(this.added).length
        ? { ...this.obj, ...this.added }
        : this.obj;
    }
  }
  
  module.exports = Response;