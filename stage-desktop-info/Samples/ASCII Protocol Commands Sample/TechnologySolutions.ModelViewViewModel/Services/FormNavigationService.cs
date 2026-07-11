//-----------------------------------------------------------------------
// <copyright file="FormNavigationService.cs" company="Technology Solutions UK Ltd"> 
//     Copyright (c) 2013 Technology Solutions UK Ltd. All rights reserved. 
// </copyright> 
// <author>Robin Stone</author>
//-----------------------------------------------------------------------
namespace TechnologySolutions.ModelViewViewModel.Services
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Text;
    using System.Windows.Forms;

    using TechnologySolutions.ModelViewViewModel;

    /// <summary>
    /// Implementation of the <see cref="INavigationService"/> for Windows Forms
    /// </summary>
    public class FormNavigationService
        : INavigationService
    {
        /// <summary>
        /// Backing field for ActiveView
        /// </summary>
        private Form activeView;

        /// <summary>
        /// Cache of existing views
        /// </summary>
        private IDictionary<Type, Form> forms;

        /// <summary>
        /// Holds the navigation history
        /// </summary>
        private Stack<Form> history;

        /// <summary>
        /// Initializes a new instance of the FormNavigationService class
        /// </summary>
        public FormNavigationService()
        {
            this.forms = new Dictionary<Type, Form>();
            this.history = new Stack<Form>();
        }

        /// <summary>
        /// Raised when the current view is changed
        /// </summary>
        public event EventHandler ActiveViewChanged;

        /// <summary>
        /// Gets the currently displayed view
        /// </summary>
        public Form ActiveView
        {
            get
            {
                return this.activeView;
            }

            private set
            {
                if (this.activeView != value)
                {
                    this.activeView = value;
                    this.OnActiveViewChanged();
                }
            }
        }

        /// <summary>
        /// Return to the previous view
        /// </summary>
        public void GoBack()
        {
            if (this.history.Count > 0)
            {
                this.ActiveView = this.history.Pop();
            }
        }

        /// <summary>
        /// Changes the currently displayed view to the one specified
        /// </summary>
        /// <param name="viewType">The type of view required</param>
        public void NavigateTo(Type viewType)
        {
            if ((this.ActiveView == null) || this.ActiveView.GetType() != viewType)
            {
                if (!this.forms.ContainsKey(viewType))
                {
                    Form view;

                    view = (Form)Activator.CreateInstance(viewType);
                    view.Closed += this.View_Closed;
                    this.forms.Add(viewType, view);
                }

                if (this.ActiveView != null)
                {
                    this.history.Push(this.ActiveView);
                }

                this.ActiveView = this.forms[viewType];
                this.ActiveView.Show();
            }
        }

        /// <summary>
        /// Changes the currently displayed view to the one specified
        /// </summary>
        /// <typeparam name="ViewType">The view required</typeparam>
        public void NavigateTo<ViewType>() where ViewType : Form
        {
            this.NavigateTo(typeof(ViewType));
        }

        /// <summary>
        /// Closes all views to exit the application
        /// </summary>
        public void Exit()
        {
            if ((this.ActiveView != null) && this.ActiveView.InvokeRequired)
            {
                this.ActiveView.Invoke(new Action(this.Exit), null);
            }
            else
            {
                while (this.forms.Count > 0)
                {
                    Form view;

                    view = this.forms.Values.Last();
                    view.Close();
                }
            }
        }

        /// <summary>
        /// Raises the ActiveViewChanged event
        /// </summary>
        protected virtual void OnActiveViewChanged()
        {
            EventHandler handler = this.ActiveViewChanged;

            if (handler != null)
            {
                handler(this, EventArgs.Empty);
            }
        }

        /// <summary>
        /// When a view is closed release references to it and return to the previous view
        /// </summary>
        /// <param name="sender">The event source</param>
        /// <param name="e">Data provided for the event</param>
        private void View_Closed(object sender, EventArgs e)
        {
            this.forms.Remove(sender.GetType());
            if (this.ActiveView == sender)
            {
                this.GoBack();
            }
        }
    }
}
