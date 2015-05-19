/**
 * Created by redhome-小七 on 15/5/19.
 */
/*model绑定到含有dom的view   collection绑定到含有view的view*/
/*model对应view时 双方绑定元素
  model必须实现set unset  view元素需要具有delete_view delete_view_element un_two_way_bind get_val set_val delete_dom data_bind data_type属性*/
/*collection对应view时 双方帮顶元素
  collection必须实现add    view的view元素需要有delete_view delete_view_element data_bind create_view(必须返回view元素  create_view_with_model */

_.extend($.prototype, {

  data_bind : "",
  data_type : "",

  get_val : function(){
    if(this["data_type"] == "input"){
      return this.val();
    }
    else{
      return this.html();
    }
  },

  set_val : function(val){
    if(this["data_type"] == "input"){
      this.val(val);
    }
    else{
      this.html(val);
    }
  },

  un_two_way_bind : function(){},

  delete_dom : function(){
    this.remove();
    this.un_two_way_bind();
  }

});

_.extend(Backbone.View.prototype, {

  data_bind : "",
  data_type : "",

  view_elements : {},

  two_way_bind_tar : {},

  two_way_bind : function(tar){

    if(!tar)
      return;

    this.two_way_bind_tar = tar;

    var thisClass = this;

    if(this.two_way_bind_tar instanceof Backbone.Collection){

      this.collection_add_function = this.collection_add(thisClass);
      this.collection_remove_function = this.collection_remove(thisClass);

      tar.on("add", this.collection_add_function);
      tar.on("remove", this.collection_remove_function);

    }

    _.each(this.view_elements, function(content,index){

      if(content instanceof $){
        thisClass.bind_jquery_dom(content, index);
      }
      else if(content instanceof Backbone.View){
        thisClass.bind_view(content, index);
      }

    });

  },

  un_two_way_bind : function(){
    if(this.two_way_bind_tar instanceof Backbone.Collection){
      tar.off("add");
      tar.off("remove");
    }
  },

  collection_add_function : {},

  collection_add : function(tar){

    return function(model, collection, options){

      var view = tar.create_view();

      view.data_bind = model.cid;
      view.data_type = "view";

      view.two_way_bind(model);

    };

  },

  collection_remove_function : {},

  collection_remove : function(tar){

    return function(model, collection, options){

      _.each(tar.view_elements, function(context, index){

        if(context.data_bind == model.cid){
          tar.delete_view_element(index);
        }

      });

    };

  },

  delete_view_element : function(index){
    if(this.two_way_bind_tar instanceof Backbone.Collection){
      this.two_way_bind_tar.remove(this.view_elements[index].data_bind, {silent : true});
      this.view_elements[index].delete_view();
      delete this.view_elements[index];
    }
    else{
      this.view_elements[index].delete_dom();
      delete this.view_elements[index];
    }
  },

  delete_view : function(){
    /*delete all elements*/
    var thisClass = this;
    _.each(this.view_elements, function(context, index){
      thisClass.delete_view_element(index);
    });

    this.un_two_way_bind();
  },

  create_view : function(){},

  create_view_with_model : function(obj){
    this.two_way_bind_tar.add(obj);
  },

  bind_view : function(view_ele, name){

    var ele = view_ele;
    var tar = this.two_way_bind_tar;

    var model = tar.get(ele.data_bind);
    ele.two_way_bind(model);

  },

  bind_jquery_dom : function(view_ele, name){

    var ele = $(view_ele);
    var index = name;

    var thisClass = this;

    ele["data_bind"] = ele.attr("data_bind");
    ele["data_type"] = ele.attr("data_type");

    var tar = this.two_way_bind_tar;

    ele.on("change", function(){
      tar.set(ele.data_bind, ele.get_val(), {silent : true});
    });

    ele.on("remove", function(){
      tar.unset(ele.data_bind, {silent : true});
    });

    ele.un_two_way_bind = function(){
      this.off("change");
      this.off("remove");
    };


    var modelChange = function(model, option){

      if(option.unset){
        ele.off("change", modelChange);
        /*
        ele.delete_dom();
        delete thisClass.view_elements[index];
        */
        thisClass.delete_view_element(index);
      }
      else{
        ele.set_val(model.get(ele.data_bind));
      }

    };

    tar.on("change", modelChange);

    ele.set_val((tar.get(ele.data_bind)));
  }

});