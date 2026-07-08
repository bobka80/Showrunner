//-----------------------------------------------------------------------
// <copyright file="BindExtensions.cs" company="Technology Solutions UK Ltd"> 
//     Copyright (c) 2013 Technology Solutions UK Ltd. All rights reserved. 
// </copyright> 
// <author>Robin Stone</author>
//-----------------------------------------------------------------------
namespace TechnologySolutions.ModelViewViewModel.Views
{
    using System;    
    using System.Collections.Generic;
    using System.Linq;
    using System.Text;
    using System.Windows.Forms;

    using ViewModels;

    /// <summary>
    /// Extension methods to help bind controls to a view model
    /// </summary>
    public static class BindExtensions
    {
        /// <summary>
        /// Returns or creates a IList&lt;CommandBinder&gt; stored in the Tag property of the form
        /// </summary>
        /// <param name="form">The form to get the binding for</param>
        /// <returns>The Tag property of the form cast to command binding list</returns>
        public static IList<CommandBinder> Bindings(this Form form)
        {
            IList<CommandBinder> bindings;

            bindings = form.Tag as IList<CommandBinder>;
            if (bindings == null)
            {
                form.Tag = bindings = new List<CommandBinder>();
            }

            return bindings;
        }

        /// <summary>
        /// Performs a one way bind between control.[propertyName] and dataSource.[dataMember]
        /// </summary>
        /// <param name="control">The control with a property to update</param>
        /// <param name="propertyName">The name of the property on the target</param>
        /// <param name="dataSource">The source that implements INotifyPropertyChanged with a property to monitor</param>
        /// <param name="dataMember">The name of the property on the DataSource to data bind</param>
        public static void Bind(this Control control, string propertyName, object dataSource, string dataMember)
        {
            control.Tag = new OneWayBinder(control, propertyName, dataSource, dataMember);
        }

        /// <summary>
        /// Bind the button to the command
        /// </summary>
        /// <param name="form">The form that has a binding stored in its Tag property</param>
        /// <param name="button">The button to bind</param>
        /// <param name="command">The command to bind</param>
        public static void Bind(this Form form, Control button, ICommand command)
        {
            form.Bindings().Bind(button, command);
        }

        /// <summary>
        /// Bind the button to the command
        /// </summary>
        /// <param name="form">The form that has a binding stored in its Tag property</param>
        /// <param name="menuItem">The menu item to bind</param>
        /// <param name="command">The command to bind</param>
        public static void Bind(this Form form, MenuItem menuItem, ICommand command)
        {
            form.Bindings().Bind(menuItem, command);
        }

        /// <summary>
        /// Bind the button to the command
        /// </summary>
        /// <param name="commandBindings">Where to store the binding</param>
        /// <param name="button">The button to bind</param>
        /// <param name="command">The command to bind</param>
        public static void Bind(this IList<CommandBinder> commandBindings, Control button, ICommand command)
        {
            commandBindings.Add(new ButtonBinder(button, command));
        }

        /// <summary>
        /// Bind the button to the command
        /// </summary>
        /// <param name="commandBindings">Where to store the binding</param>
        /// <param name="button">The button to bind</param>
        /// <param name="command">The command to bind</param>
        /// <param name="parameter">The parameter to pass to CanExecute(parameter) and Execute(parameter)</param>
        public static void Bind(this IList<CommandBinder> commandBindings, Control button, ICommand command, object parameter)
        {
            commandBindings.Add(new ButtonBinder(button, command) { Parameter = parameter });
        }

        /// <summary>
        /// Bind the mneu item to the command
        /// </summary>
        /// <param name="commandBindings">Where to store the binding</param>
        /// <param name="menuItem">The menu item to bind</param>
        /// <param name="command">The command to bind</param>
        public static void Bind(this IList<CommandBinder> commandBindings, MenuItem menuItem, ICommand command)
        {
            commandBindings.Add(new MenuItemBinder(menuItem, command));
        }

        /// <summary>
        /// Bind dataSource.[dataMember] so changes are reflected to item.[propertyName]
        /// </summary>
        /// <param name="target">The target object with a property to update</param>
        /// <param name="propertyName">The name of the property on the target</param>
        /// <param name="dataSource">The source that implements INotifyPropertyChanged with a property to monitor</param>
        /// <param name="dataMember">The name of the property on the DataSource to data bind</param>
        public static void OneWayBind(this Control target, string propertyName, object dataSource, string dataMember)
        {
            target.Tag = new OneWayBinder(target, propertyName, dataSource, dataMember);
        }

#if !PocketPC

        /// <summary>
        /// Bind dataSource.[dataMember] so changes are reflected to item.[propertyName]
        /// </summary>
        /// <param name="target">The target object with a property to update</param>
        /// <param name="propertyName">The name of the property on the target</param>
        /// <param name="dataSource">The source that implements INotifyPropertyChanged with a property to monitor</param>
        /// <param name="dataMember">The name of the property on the DataSource to data bind</param>
        public static void OneWayBind(this ToolStripItem target, string propertyName, object dataSource, string dataMember)
        {
            target.Tag = new OneWayBinder(target, propertyName, dataSource, dataMember);
        }

        /// <summary>
        /// Bind the mneu item to the command
        /// </summary>
        /// <param name="commandBindings">Where to store the binding</param>
        /// <param name="menuItem">The menu item to bind</param>
        /// <param name="command">The command to bind</param>
        public static void Bind(this IList<CommandBinder> commandBindings, ToolStripItem menuItem, ICommand command)
        {
            commandBindings.Add(new ToolStripItemBinder(menuItem, command));
        }

        /// <summary>
        /// Bind the mneu item to the command
        /// </summary>
        /// <param name="commandBindings">Where to store the binding</param>
        /// <param name="menuItem">The menu item to bind</param>
        /// <param name="command">The command to bind</param>
        /// <param name="parameter">The parameter to pass to CanExecute(parameter) and Execute(parameter)</param>
        public static void Bind(this IList<CommandBinder> commandBindings, ToolStripItem menuItem, ICommand command, object parameter)
        {
            commandBindings.Add(new ToolStripItemBinder(menuItem, command) { Parameter = parameter });
        }

                /// <summary>
        /// Performs a one way bind between control.[propertyName] and dataSource.[dataMember]
        /// </summary>
        /// <param name="control">The control with a property to update</param>
        /// <param name="propertyName">The name of the property on the target</param>
        /// <param name="dataSource">The source that implements INotifyPropertyChanged with a property to monitor</param>
        /// <param name="dataMember">The name of the property on the DataSource to data bind</param>
        public static void Bind(this ToolStripItem control, string propertyName, object dataSource, string dataMember)
        {
            control.Tag = new OneWayBinder(control, propertyName, dataSource, dataMember);
        }
#endif
    }
}
